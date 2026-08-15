import { NextResponse } from "next/server";

import {
  getAvailableExtendMinutes,
  getExtendBaseMs,
  getNextBlockingStartMs,
} from "@/features/booking/lib/booking-extend";
import {
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";
import { isRoomOverlapConstraintError } from "@/features/booking/lib/validate-booking-update";
import { computeBookingPriceCents } from "@/features/services/server/get-service-price";
import {
  parsePaymentMethodFromNotes,
  paymentMethodForPricing,
} from "@/features/booking/lib/internal-payment-method";
import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

const ALLOWED_EXTEND = new Set([5, 10, 15, 20, 30]);

const bookingSelect =
  "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email, notes, created_at, updated_at, staff(name), rooms(name)";

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

  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: staffName ?? "Staff",
    roomId: row.room_id,
    roomName: roomName ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    status: row.status,
    checkedOutAt: row.checked_out_at,
    checkedInAt: row.checked_in_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerPostcode: row.customer_postcode,
    customerEmail: row.customer_email,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Extend an in-progress booking's end time (admin or assigned staff). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant, actor } = await requireTenantAndAdminActor(request, {
      allowStaff: true,
    });
    const { id } = await params;
    const body = (await request.json()) as { minutes?: number };
    const minutes = Number(body.minutes);

    if (!ALLOWED_EXTEND.has(minutes)) {
      return NextResponse.json(
        { error: "minutes must be one of 5, 10, 15, 20, or 30." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const { data: existing, error: fetchError } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, status, checked_out_at, checked_in_at, payment_status, notes",
      )
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 503 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (actor.role === "staff" && existing.staff_id !== actor.staffId) {
      return NextResponse.json(
        { error: "You can only extend your own booking." },
        { status: 403 },
      );
    }

    if (
      existing.checked_out_at ||
      existing.status === "completed" ||
      existing.status === "cancelled"
    ) {
      return NextResponse.json(
        { error: "This booking can no longer be extended." },
        { status: 400 },
      );
    }

    if (!existing.checked_in_at) {
      return NextResponse.json(
        { error: "Extend is only available after check-in." },
        { status: 400 },
      );
    }

    const now = new Date();
    const baseMs = getExtendBaseMs(existing.ends_at, now);
    const newEndsAt = new Date(baseMs + minutes * 60_000);
    const startsMs = new Date(existing.starts_at).getTime();
    const durationMinutes = Math.max(
      1,
      Math.round((newEndsAt.getTime() - startsMs) / 60_000),
    );

    const untilIso = new Date(baseMs + 24 * 60 * 60_000).toISOString();
    let blockingQuery = supabase
      .from("bookings")
      .select("id, starts_at, room_id, staff_id")
      .eq("tenant_id", tenant.id)
      .neq("id", id)
      .neq("status", "cancelled")
      .neq("status", "completed")
      .gt("starts_at", new Date(baseMs).toISOString())
      .lt("starts_at", untilIso);
    if (existing.room_id) {
      blockingQuery = blockingQuery.or(
        `room_id.eq.${existing.room_id},staff_id.eq.${existing.staff_id}`,
      );
    } else {
      blockingQuery = blockingQuery.eq("staff_id", existing.staff_id);
    }
    const { data: blockingRows } = await blockingQuery;
    const blockingStarts = (blockingRows ?? [])
      .filter(
        (row) =>
          row.staff_id === existing.staff_id ||
          (existing.room_id !== null && row.room_id === existing.room_id),
      )
      .map((row) => row.starts_at);
    const nextBlockMs = getNextBlockingStartMs(baseMs, blockingStarts);
    const available = getAvailableExtendMinutes(
      existing.ends_at,
      blockingStarts,
      [...ALLOWED_EXTEND],
      now,
    );
    if (nextBlockMs !== null && newEndsAt.getTime() > nextBlockMs) {
      const maxMinutes = Math.floor((nextBlockMs - baseMs) / 60_000);
      return NextResponse.json(
        {
          error:
            maxMinutes > 0
              ? `Cannot extend that long — next booking starts soon. Up to +${maxMinutes}m available.`
              : "Cannot extend — another booking starts soon.",
          maxExtendMinutes: Math.max(0, maxMinutes),
          availableExtendMinutes: available,
        },
        { status: 409 },
      );
    }

    const staffBusy = await hasStaffBookingConflict(
      supabase,
      tenant.id,
      existing.staff_id,
      existing.starts_at,
      newEndsAt.toISOString(),
      id,
    );
    const roomBusy = existing.room_id
      ? await hasRoomBookingConflict(
          supabase,
          tenant.id,
          existing.room_id,
          existing.starts_at,
          newEndsAt.toISOString(),
          id,
        )
      : false;
    if (staffBusy || roomBusy) {
      return NextResponse.json(
        { error: "Cannot extend — another booking conflicts." },
        { status: 409 },
      );
    }

    let priceCents = 0;
    let staffPayoutCents: number | null = null;
    try {
      const paymentMethod = parsePaymentMethodFromNotes(existing.notes);
      const isInternal = existing.payment_status === "not_required";
      const priced = await computeBookingPriceCents(supabase, {
        tenantId: tenant.id,
        durationMinutes,
        startsAtIso: existing.starts_at,
        timeZone: tenant.settings.timezone || "Australia/Sydney",
        channel: isInternal ? "internal" : "external",
        adjustments: tenant.settings.pricingAdjustments,
        paymentMethod: isInternal
          ? paymentMethodForPricing(paymentMethod)
          : null,
      });
      priceCents = priced?.totalCents ?? 0;
      staffPayoutCents = priced?.staffPayoutCents ?? null;
    } catch {
      // Keep previous price if no matching service option.
      priceCents = 0;
    }

    const updates: {
      ends_at: string;
      duration_minutes: number;
      updated_at: string;
      price_cents?: number;
      staff_payout_cents?: number;
    } = {
      ends_at: newEndsAt.toISOString(),
      duration_minutes: durationMinutes,
      updated_at: new Date().toISOString(),
    };
    if (priceCents > 0) {
      updates.price_cents = priceCents;
      if (staffPayoutCents != null) {
        updates.staff_payout_cents = staffPayoutCents;
      }
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(bookingSelect)
      .maybeSingle();

    if (error || !data) {
      if (isRoomOverlapConstraintError(error)) {
        return NextResponse.json(
          { error: "Cannot extend — room conflict." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: error?.message ?? "Could not extend booking." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      booking: mapBooking(data),
      extendedByMinutes: minutes,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
