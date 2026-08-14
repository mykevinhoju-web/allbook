import { after } from "next/server";
import { NextResponse } from "next/server";

import { assignAvailableRoom } from "@/features/booking/lib/assign-room";
import { ensurePrimaryBookingStaff } from "@/features/booking/lib/booking-staffs";
import {
  formatAuPostcodeInput,
  isValidAuMobile,
  isValidAuPostcode,
  normalizeAuMobile,
} from "@/features/booking/lib/au-contact";
import {
  isInternalPaymentMethod,
  parsePaymentMethodFromNotes,
  parseSplitCashCentsFromNotes,
  paymentMethodForPricing,
  paymentStatusForMethod,
  validateSplitCashCents,
  withPaymentMethodNote,
} from "@/features/booking/lib/internal-payment-method";
import {
  isOutCallBooking,
  visibleBookingNotes,
  withOutCallNote,
} from "@/features/booking/lib/booking-outcall";
import {
  ensureOtherStaffMember,
  isOtherStaffBooking,
  parseOtherStaffName,
  withOtherStaffNote,
} from "@/features/booking/lib/booking-other-staff";
import {
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";
import { isBookingOverlapConstraintError, isRoomOverlapConstraintError } from "@/features/booking/lib/validate-booking-update";
import { isStartTimeOnFiveMinuteSlot } from "@/features/booking/lib/schedule-utils";
import { assignWalkInStaff } from "@/features/booking/server/assign-walk-in-staff";
import { withWalkInNote, isWalkInBooking } from "@/features/booking/lib/walk-in-rotation";
import { autoCheckoutExpiredBookings } from "@/features/booking/server/auto-checkout-expired";
import { computeBookingPriceCents } from "@/features/services/server/get-service-price";
import { sendBookingPushNotifications } from "@/lib/push/send-booking-push";
import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import type { BookingStatus } from "@/types";

function isOverlapConstraintError(error: { code?: string; message?: string } | null) {
  return isBookingOverlapConstraintError(error);
}

function getTimeZoneOffsetMs(timeZone: string, utcDate: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(utcDate);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const second = Number(get("second"));

  const asUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  return asUtcMs - utcDate.getTime();
}

function zonedMidnightToUtcIso(date: string, timeZone: string): string {
  const [yearStr, monthStr, dayStr] = date.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetMs = getTimeZoneOffsetMs(timeZone, utcGuess);
  return new Date(utcGuess.getTime() - offsetMs).toISOString();
}

function mapBooking(row: {
  id: string;
  staff_id: string;
  room_id: string | null;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  price_cents: number;
  status: string;
  checked_out_at: string | null;
  checked_in_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_postcode: string | null;
  customer_email: string | null;
  notes: string | null;
  payment_status?: string | null;
  created_at: string;
  updated_at: string;
  staff?: { name: string } | { name: string }[] | null;
  rooms?: { name: string } | { name: string }[] | null;
}) {
  const staffName = Array.isArray(row.staff)
    ? row.staff[0]?.name
    : row.staff?.name;
  const roomName = Array.isArray(row.rooms)
    ? row.rooms[0]?.name
    : row.rooms?.name;

  const otherStaffName = parseOtherStaffName(row.notes);
  const paymentMethod = parsePaymentMethodFromNotes(row.notes);

  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: otherStaffName ?? staffName ?? "Staff",
    roomId: row.room_id,
    roomName: roomName ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    status: row.status as BookingStatus,
    checkedOutAt: row.checked_out_at ?? null,
    checkedInAt: row.checked_in_at ?? null,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerPostcode: row.customer_postcode,
    customerEmail: row.customer_email,
    notes: visibleBookingNotes(row.notes),
    paymentMethod,
    splitCashCents: parseSplitCashCentsFromNotes(row.notes),
    paymentStatus: row.payment_status ?? null,
    outCall: isOutCallBooking(row.notes),
    walkIn: isWalkInBooking(row.notes),
    otherStaff: isOtherStaffBooking(row.notes),
    otherStaffName,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request, {
      allowStaff: true,
    });
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const staffId = searchParams.get("staffId");

    let rangeStart: string;
    let rangeEnd: string;

    if (from && to) {
      rangeStart = from;
      rangeEnd = to;
    } else if (date) {
      // Filter bookings by tenant-local day, not UTC midnight.
      const timeZone = tenant.settings.timezone || "Australia/Sydney";
      rangeStart = zonedMidnightToUtcIso(date, timeZone);
      const [y, m, d] = date.split("-").map(Number);
      const nextDay = new Date(
        Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0),
      );
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      const nextDate = nextDay.toISOString().slice(0, 10);
      rangeEnd = zonedMidnightToUtcIso(nextDate, timeZone);
    } else {
      return NextResponse.json(
        { error: "date or from/to is required." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    await autoCheckoutExpiredBookings(supabase, { tenantId: tenant.id });
    let query = supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email, notes, payment_status, created_at, updated_at, staff(name), rooms(name)",
      )
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true });

    if (from && to) {
      // Overlap with the availability window (supports overnight shifts).
      query = query.lt("starts_at", rangeEnd).gt("ends_at", rangeStart);
    } else {
      // Any booking that touches this tenant-local calendar day.
      query = query.lt("starts_at", rangeEnd).gt("ends_at", rangeStart);
    }

    if (staffId) {
      query = query.eq("staff_id", staffId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      bookings: (data ?? []).map((row) => mapBooking(row)),
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request, {
      allowStaff: true,
    });
    const body = (await request.json()) as {
      staffId?: string;
      startsAt?: string;
      durationMinutes?: number;
      customerName?: string;
      customerPhone?: string;
      customerPostcode?: string;
      customerEmail?: string;
      notes?: string;
      status?: BookingStatus;
      roomId?: string | null;
      paymentMethod?: string;
      /** Cash portion in cents when paymentMethod is split. */
      splitCashCents?: number;
      /** When true, bypass the 5-minute-step constraint (used by internal "Now" button). */
      allowImmediateStart?: boolean;
      /** Off-site service — skip treatment room assignment. */
      outCall?: boolean;
      /** External staff — name entered in admin form. */
      otherStaff?: boolean;
      otherStaffName?: string;
      /** Walk-in with no chosen staff — assign from today's rotation. */
      walkIn?: boolean;
    };

    const otherStaff = Boolean(body.otherStaff);
    const otherStaffName = body.otherStaffName?.trim() ?? "";
    const walkIn = Boolean(body.walkIn);

    if (!body.startsAt || !body.durationMinutes) {
      return NextResponse.json(
        { error: "startsAt and durationMinutes are required." },
        { status: 400 },
      );
    }

    if (otherStaff) {
      if (!otherStaffName) {
        return NextResponse.json(
          { error: "Enter the other staff name." },
          { status: 400 },
        );
      }
    } else if (!walkIn && !body.staffId) {
      return NextResponse.json(
        { error: "staffId, startsAt, and durationMinutes are required." },
        { status: 400 },
      );
    }

    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Customer name and phone are required." },
        { status: 400 },
      );
    }

    if (!isValidAuMobile(body.customerPhone)) {
      return NextResponse.json(
        { error: "Enter a valid Australian mobile (04XX XXX XXX)." },
        { status: 400 },
      );
    }

    if (!body.customerPostcode?.trim() || !isValidAuPostcode(body.customerPostcode)) {
      return NextResponse.json(
        { error: "Enter a valid Queensland postcode (4XXX)." },
        { status: 400 },
      );
    }

    const customerPhone = normalizeAuMobile(body.customerPhone);
    const customerPostcode = formatAuPostcodeInput(body.customerPostcode);

    if (!isInternalPaymentMethod(body.paymentMethod)) {
      return NextResponse.json(
        { error: "Select a payment method." },
        { status: 400 },
      );
    }
    const paymentMethod = body.paymentMethod;

    const durationMinutes = body.durationMinutes;
    const supabase = createServiceSupabase();
    await autoCheckoutExpiredBookings(supabase, { tenantId: tenant.id });
    const timeZone = tenant.settings.timezone || "Australia/Sydney";

    const priced = await computeBookingPriceCents(supabase, {
      tenantId: tenant.id,
      durationMinutes,
      startsAtIso: body.startsAt,
      timeZone,
      channel: "internal",
      adjustments: tenant.settings.pricingAdjustments,
      paymentMethod: paymentMethodForPricing(paymentMethod),
    });

    if (priced === null) {
      return NextResponse.json(
        { error: "No price configured for this service duration." },
        { status: 400 },
      );
    }
    const priceCents = priced.totalCents;

    let splitCashCents: number | null = null;
    if (paymentMethod === "split") {
      splitCashCents = validateSplitCashCents(body.splitCashCents, priceCents);
      if (splitCashCents == null) {
        return NextResponse.json(
          {
            error:
              "Enter a cash amount greater than 0 and less than the total for Split.",
          },
          { status: 400 },
        );
      }
    }

    const startsAt = new Date(body.startsAt);

    if (
      !body.allowImmediateStart &&
      !isStartTimeOnFiveMinuteSlot(startsAt.toISOString())
    ) {
      return NextResponse.json(
        { error: "Start time must be on a 5-minute step (e.g. 10:00, 10:05)." },
        { status: 400 },
      );
    }

    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

    let staffId = body.staffId ?? "";
    if (walkIn) {
      if (staffId) {
        const busy = await hasStaffBookingConflict(
          supabase,
          tenant.id,
          staffId,
          startsAt.toISOString(),
          endsAt.toISOString(),
        );
        if (busy) {
          const assigned = await assignWalkInStaff({
            supabase,
            tenantId: tenant.id,
            timeZone,
            startsAtIso: startsAt.toISOString(),
            endsAtIso: endsAt.toISOString(),
          });
          if (!assigned.ok) {
            return NextResponse.json(
              { error: assigned.error },
              { status: assigned.status },
            );
          }
          staffId = assigned.staffId;
        }
      } else {
        const assigned = await assignWalkInStaff({
          supabase,
          tenantId: tenant.id,
          timeZone,
          startsAtIso: startsAt.toISOString(),
          endsAtIso: endsAt.toISOString(),
        });
        if (!assigned.ok) {
          return NextResponse.json(
            { error: assigned.error },
            { status: assigned.status },
          );
        }
        staffId = assigned.staffId;
      }
    } else if (otherStaff) {
      try {
        const guest = await ensureOtherStaffMember(
          supabase,
          tenant.id,
          otherStaffName,
        );
        staffId = guest.id;
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Could not save other staff.",
          },
          { status: 503 },
        );
      }
    } else if (
      await hasStaffBookingConflict(
        supabase,
        tenant.id,
        staffId,
        startsAt.toISOString(),
        endsAt.toISOString(),
      )
    ) {
      return NextResponse.json(
        { error: "This staff member already has a booking in that time slot." },
        { status: 409 },
      );
    }

    const outCall = Boolean(body.outCall);

    const roomId = outCall
      ? null
      : (body.roomId ??
        (await assignAvailableRoom(
          supabase,
          tenant.id,
          startsAt.toISOString(),
          endsAt.toISOString(),
        )));

    if (!outCall && !roomId) {
      return NextResponse.json(
        { error: "No treatment room available for this time slot." },
        { status: 409 },
      );
    }

    if (
      roomId &&
      (await hasRoomBookingConflict(
        supabase,
        tenant.id,
        roomId,
        startsAt.toISOString(),
        endsAt.toISOString(),
      ))
    ) {
      return NextResponse.json(
        { error: "This room is already booked for that time slot." },
        { status: 409 },
      );
    }

    if (body.roomId && !outCall) {
      const { data: roomRow } = await supabase
        .from("rooms")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("id", body.roomId)
        .eq("is_active", true)
        .maybeSingle();

      if (!roomRow) {
        return NextResponse.json(
          { error: "Selected room is not available." },
          { status: 400 },
        );
      }
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        tenant_id: tenant.id,
        staff_id: staffId,
        room_id: roomId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        duration_minutes: durationMinutes,
        price_cents: priceCents,
        status: body.status ?? "confirmed",
        // Pre bookings stay unpaid until admin confirms payment.
        payment_status: paymentStatusForMethod(paymentMethod),
        customer_name: body.customerName.trim(),
        customer_phone: customerPhone,
        customer_postcode: customerPostcode,
        customer_email: body.customerEmail?.trim() ?? null,
        notes: withPaymentMethodNote(
          paymentMethod,
          (() => {
            let notes = body.notes ?? null;
            if (outCall) notes = withOutCallNote(notes);
            if (otherStaff) notes = withOtherStaffNote(otherStaffName, notes);
            if (walkIn) notes = withWalkInNote(notes);
            return notes;
          })(),
          splitCashCents,
        ),
      })
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email, notes, payment_status, created_at, updated_at, staff(name), rooms(name)",
      )
      .single();

    if (error || !data) {
      if (isOverlapConstraintError(error)) {
        return NextResponse.json(
          {
            error: isRoomOverlapConstraintError(error)
              ? "This room is already booked for that time slot."
              : "This staff member already has a booking in that time slot.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: error?.message ?? "Failed to create booking." },
        { status: 503 },
      );
    }

    try {
      await ensurePrimaryBookingStaff(supabase, {
        tenantId: tenant.id,
        bookingId: (data as { id: string }).id,
        staffId,
      });
    } catch (staffError) {
      await supabase
        .from("bookings")
        .delete()
        .eq("id", (data as { id: string }).id);
      return NextResponse.json(
        {
          error:
            staffError instanceof Error
              ? staffError.message
              : "Failed to assign staff to booking.",
        },
        { status: 503 },
      );
    }

    const created = mapBooking(data);

    // Notifications run after the response so booking latency stays low at scale.
    after(async () => {
      if (otherStaff) return;
      await supabase.from("booking_alert_events").insert({
        tenant_slug: tenant.slug,
        staff_id: created.staffId,
        staff_name: created.staffName,
      });
      await sendBookingPushNotifications(tenant.slug, {
        staffId: created.staffId,
        staffName: created.staffName,
        roomName: created.roomName,
        startsAt: created.startsAt,
        endsAt: created.endsAt,
      });
    });

    return NextResponse.json({ booking: created });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
