import { NextResponse } from "next/server";

import {
  isInternalPaymentMethod,
  parsePaymentMethodFromNotes,
} from "@/features/booking/lib/internal-payment-method";
import { applyBookingExtend } from "@/features/booking/server/apply-booking-extend";
import { createServiceSupabase } from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

/** Admin approves a room extend request using the booking's payment method. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { id } = await params;

    const supabase = createServiceSupabase();
    const { data: existing, error: fetchError } = await supabase
      .from("booking_extend_requests")
      .select("id, booking_id, minutes, status")
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 503 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "This extend request was already handled." },
        { status: 409 },
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("notes")
      .eq("tenant_id", tenant.id)
      .eq("id", existing.booking_id)
      .maybeSingle();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 503 });
    }
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const paymentMethod = parsePaymentMethodFromNotes(booking.notes);
    if (!isInternalPaymentMethod(paymentMethod)) {
      return NextResponse.json(
        { error: "This booking has no payment method from the room." },
        { status: 400 },
      );
    }

    const { data: options } = await supabase
      .from("service_options")
      .select("duration_minutes")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true);
    const allowed = (options ?? []).map((row) => row.duration_minutes);

    const result = await applyBookingExtend({
      supabase,
      tenantId: tenant.id,
      bookingId: existing.booking_id,
      minutes: existing.minutes,
      timeZone: tenant.settings.timezone || "Australia/Sydney",
      allowedMinutes: allowed.length > 0 ? allowed : [existing.minutes],
      paymentMethod,
      pricingAdjustments: tenant.settings.pricingAdjustments,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          availableExtendMinutes: result.availableExtendMinutes,
        },
        { status: result.status },
      );
    }

    const resolvedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("booking_extend_requests")
      .update({
        status: "approved",
        payment_method: paymentMethod,
        price_cents: result.booking.priceCents,
        resolved_at: resolvedAt,
        updated_at: resolvedAt,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .eq("status", "pending");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      booking: result.booking,
      extendedByMinutes: result.extendedByMinutes,
      requestId: id,
      resolvedAt,
    });
  } catch (error) {
    const handled = handleAdminRouteError(error);
    if (handled) return handled;
    throw error;
  }
}
