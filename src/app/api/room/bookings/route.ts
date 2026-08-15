import { NextResponse } from "next/server";

import { ensurePrimaryBookingStaff } from "@/features/booking/lib/booking-staffs";
import {
  formatAuPostcodeInput,
  isValidAuMobile,
  isValidAuPostcode,
  normalizeAuMobile,
} from "@/features/booking/lib/au-contact";
import {
  formatCustomerBookingName,
  isValidCustomerBookingNameParts,
} from "@/features/booking/lib/customer-booking-name";
import {
  isInternalPaymentMethod,
  paymentMethodForPricing,
  paymentStatusForMethod,
  validateSplitCashCents,
  withPaymentMethodNote,
} from "@/features/booking/lib/internal-payment-method";
import { withRoomStartNote } from "@/features/booking/lib/room-start";
import { withWalkInNote } from "@/features/booking/lib/walk-in-rotation";
import {
  findRoomActiveService,
  findStaffActiveService,
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";
import {
  isBookingOverlapConstraintError,
  isRoomOverlapConstraintError,
} from "@/features/booking/lib/validate-booking-update";
import { autoCheckoutExpiredBookings } from "@/features/booking/server/auto-checkout-expired";
import { computeBookingPriceCents } from "@/features/services/server/get-service-price";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  RoomAuthError,
  requireRoomSession,
} from "@/lib/server/require-room-session";
import {
  StaffAuthError,
  requireStaffSession,
} from "@/lib/server/require-staff-session";

/**
 * Empty-room walk-in: logged-in staff starts service now in this room.
 */
export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const roomSession = await requireRoomSession(tenant.id, request);
    const staffSession = await requireStaffSession(tenant.id, request);
    const body = (await request.json()) as {
      durationMinutes?: number;
      paymentMethod?: string;
      splitCashCents?: number;
      customerFirstName?: string;
      customerLastName?: string;
      customerPhone?: string;
      customerPostcode?: string;
      customerEmail?: string;
    };

    const durationMinutes = Number(body.durationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return NextResponse.json(
        { error: "Select a service duration." },
        { status: 400 },
      );
    }

    if (
      !isValidCustomerBookingNameParts(
        body.customerFirstName ?? "",
        body.customerLastName ?? "",
      )
    ) {
      return NextResponse.json(
        { error: "Enter first name and lastname initial." },
        { status: 400 },
      );
    }

    if (!body.customerPhone?.trim() || !isValidAuMobile(body.customerPhone)) {
      return NextResponse.json(
        { error: "Enter a valid Australian mobile (04XX XXX XXX)." },
        { status: 400 },
      );
    }

    if (
      !body.customerPostcode?.trim() ||
      !isValidAuPostcode(body.customerPostcode)
    ) {
      return NextResponse.json(
        { error: "Enter a valid Queensland postcode (4XXX)." },
        { status: 400 },
      );
    }

    if (!isInternalPaymentMethod(body.paymentMethod)) {
      return NextResponse.json(
        { error: "Select a payment method." },
        { status: 400 },
      );
    }
    const paymentMethod = body.paymentMethod;
    const customerName = formatCustomerBookingName(
      body.customerFirstName ?? "",
      body.customerLastName ?? "",
    );
    const customerPhone = normalizeAuMobile(body.customerPhone);
    const customerPostcode = formatAuPostcodeInput(body.customerPostcode);
    const customerEmail = body.customerEmail?.trim() || null;
    const staffId = staffSession.staffId;
    const roomId = roomSession.roomId;
    const startsAtIso = new Date().toISOString();
    const endsAtIso = new Date(
      Date.now() + durationMinutes * 60_000,
    ).toISOString();

    const supabase = createServiceSupabase();
    await autoCheckoutExpiredBookings(supabase, { tenantId: tenant.id });

    const { data: staffRow } = await supabase
      .from("staff")
      .select("id, name, status")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (!staffRow || staffRow.status === "inactive") {
      return NextResponse.json(
        { error: "Staff account is not available." },
        { status: 400 },
      );
    }

    const roomBusy = await findRoomActiveService(
      supabase,
      tenant.id,
      roomId,
    );
    if (roomBusy) {
      return NextResponse.json(
        { error: "This room already has a service in progress." },
        { status: 409 },
      );
    }

    const staffBusy = await findStaffActiveService(
      supabase,
      tenant.id,
      staffId,
    );
    if (staffBusy) {
      return NextResponse.json(
        { error: "You already have a service in progress." },
        { status: 409 },
      );
    }

    if (
      await hasStaffBookingConflict(
        supabase,
        tenant.id,
        staffId,
        startsAtIso,
        endsAtIso,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "That duration overlaps another booking. Choose a shorter service.",
        },
        { status: 409 },
      );
    }

    if (
      await hasRoomBookingConflict(
        supabase,
        tenant.id,
        roomId,
        startsAtIso,
        endsAtIso,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "That duration overlaps another booking in this room. Choose a shorter service.",
        },
        { status: 409 },
      );
    }

    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const priced = await computeBookingPriceCents(supabase, {
      tenantId: tenant.id,
      durationMinutes,
      startsAtIso,
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

    let splitCashCents: number | null = null;
    if (paymentMethod === "split") {
      splitCashCents = validateSplitCashCents(
        body.splitCashCents,
        priced.totalCents,
      );
      if (splitCashCents == null) {
        return NextResponse.json(
          { error: "Enter a cash amount less than the total for split pay." },
          { status: 400 },
        );
      }
    }

    const { data: created, error: insertError } = await supabase
      .from("bookings")
      .insert({
        tenant_id: tenant.id,
        staff_id: staffId,
        room_id: roomId,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
        duration_minutes: durationMinutes,
        price_cents: priced.totalCents,
        staff_payout_cents: priced.staffPayoutCents ?? 0,
        status: "confirmed",
        payment_status: paymentStatusForMethod("pre"),
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_postcode: customerPostcode,
        customer_email: customerEmail,
        notes: withPaymentMethodNote(
          "pre",
          withWalkInNote(
            withRoomStartNote(paymentMethod, null, splitCashCents),
          ),
        ),
      })
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, notes",
      )
      .single();

    if (insertError || !created) {
      if (isBookingOverlapConstraintError(insertError)) {
        return NextResponse.json(
          {
            error: isRoomOverlapConstraintError(insertError)
              ? "This room is already booked for that time."
              : "You already have a booking in that time.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: insertError?.message ?? "Could not start booking." },
        { status: 503 },
      );
    }

    try {
      await ensurePrimaryBookingStaff(supabase, {
        tenantId: tenant.id,
        bookingId: created.id,
        staffId,
      });
    } catch {
      // Non-fatal for schedule join table.
    }

    return NextResponse.json({
      ok: true,
      booking: {
        id: created.id,
        staffId: created.staff_id,
        staffName: staffRow.name,
        roomId: created.room_id,
        startsAt: created.starts_at,
        endsAt: created.ends_at,
        durationMinutes: created.duration_minutes,
        priceCents: created.price_cents,
        status: created.status,
        checkedInAt: created.checked_in_at,
        checkedOutAt: created.checked_out_at,
        customerName: created.customer_name,
      },
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RoomAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof StaffAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
