import { NextResponse } from "next/server";

import {
  computeCheckInServiceWindow,
} from "@/features/booking/lib/booking-check-in";
import { ensurePrimaryBookingStaff } from "@/features/booking/lib/booking-staffs";
import {
  isCashOrCardMethod,
  withPaymentMethodNote,
} from "@/features/booking/lib/internal-payment-method";
import {
  isRoomStartBooking,
  parseRoomStartPayment,
  stripRoomStartNote,
} from "@/features/booking/lib/room-start";
import {
  findRoomActiveService,
  findStaffActiveService,
  getCheckInBlockingStarts,
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";
import { isRoomOverlapConstraintError } from "@/features/booking/lib/validate-booking-update";
import { computeBookingPriceCents } from "@/features/services/server/get-service-price";
import { createServiceSupabase } from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { id } = await params;
    const body = (await request.json()) as { paymentMethod?: string };
    const supabase = createServiceSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, duration_minutes, notes, payment_status, status, checked_in_at, checked_out_at",
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
    if (existing.status === "cancelled") {
      return NextResponse.json(
        { error: "This booking was cancelled." },
        { status: 400 },
      );
    }
    if (
      existing.payment_status !== "unpaid" ||
      existing.checked_in_at ||
      !isRoomStartBooking(existing.notes)
    ) {
      return NextResponse.json(
        { error: "This start request is no longer pending." },
        { status: 400 },
      );
    }

    const requested = parseRoomStartPayment(existing.notes);
    const paymentMethod = isCashOrCardMethod(body.paymentMethod)
      ? body.paymentMethod
      : requested;
    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Select cash or card." },
        { status: 400 },
      );
    }

    const roomId = existing.room_id;
    if (!roomId) {
      return NextResponse.json(
        { error: "This booking has no room." },
        { status: 400 },
      );
    }

    const staffBusy = await findStaffActiveService(
      supabase,
      tenant.id,
      existing.staff_id,
      id,
    );
    if (staffBusy) {
      return NextResponse.json(
        { error: "This staff member already has a service in progress." },
        { status: 409 },
      );
    }

    const roomBusyNow = await findRoomActiveService(
      supabase,
      tenant.id,
      roomId,
      id,
    );
    if (roomBusyNow) {
      return NextResponse.json(
        { error: "This room already has a service in progress." },
        { status: 409 },
      );
    }

    const checkedInAtDate = new Date();
    const checkedInAt = checkedInAtDate.toISOString();
    const desiredEndsAt = new Date(
      checkedInAtDate.getTime() + existing.duration_minutes * 60_000,
    ).toISOString();

    const blockingStarts = await getCheckInBlockingStarts(supabase, tenant.id, {
      roomId,
      staffId: existing.staff_id,
      fromIso: checkedInAt,
      untilIso: desiredEndsAt,
      excludeBookingId: id,
    });

    const window = computeCheckInServiceWindow(
      checkedInAtDate,
      existing.duration_minutes,
      blockingStarts,
    );
    if (!window.ok) {
      return NextResponse.json({ error: window.error }, { status: 409 });
    }

    if (
      await hasStaffBookingConflict(
        supabase,
        tenant.id,
        existing.staff_id,
        window.startsAt,
        window.endsAt,
        id,
      )
    ) {
      return NextResponse.json(
        { error: "Staff already has another booking in this window." },
        { status: 409 },
      );
    }

    if (
      await hasRoomBookingConflict(
        supabase,
        tenant.id,
        roomId,
        window.startsAt,
        window.endsAt,
        id,
      )
    ) {
      return NextResponse.json(
        { error: "This room already has another booking in this window." },
        { status: 409 },
      );
    }

    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const priced = await computeBookingPriceCents(supabase, {
      tenantId: tenant.id,
      durationMinutes: existing.duration_minutes,
      startsAtIso: window.startsAt,
      timeZone,
      channel: "internal",
      adjustments: tenant.settings.pricingAdjustments,
      paymentMethod,
    });

    const notes = withPaymentMethodNote(
      paymentMethod,
      stripRoomStartNote(existing.notes),
    );

    const { data, error } = await supabase
      .from("bookings")
      .update({
        payment_status: "not_required",
        notes,
        starts_at: window.startsAt,
        ends_at: window.endsAt,
        checked_in_at: checkedInAt,
        price_cents: priced?.totalCents ?? undefined,
        staff_payout_cents: priced?.staffPayoutCents ?? undefined,
        updated_at: checkedInAt,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select("id, starts_at, ends_at")
      .maybeSingle();

    if (error || !data) {
      if (isRoomOverlapConstraintError(error)) {
        return NextResponse.json(
          { error: "This room was just taken." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: error?.message ?? "Could not approve start." },
        { status: 503 },
      );
    }

    try {
      await ensurePrimaryBookingStaff(supabase, {
        tenantId: tenant.id,
        bookingId: id,
        staffId: existing.staff_id,
      });
    } catch {
      // Non-fatal.
    }

    return NextResponse.json({
      ok: true,
      booking: {
        id: data.id,
        startsAt: data.starts_at,
        endsAt: data.ends_at,
      },
      resolvedAt: checkedInAt,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
