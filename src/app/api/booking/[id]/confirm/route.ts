import { NextResponse } from "next/server";

import { confirmBookingPayment } from "@/features/booking/server/confirm-booking-payment";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { getStripe } from "@/lib/stripe/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id: bookingId } = await params;
    const supabase = createServiceSupabase();

    const { data: payment, error } = await supabase
      .from("payments")
      .select("id, status, stripe_payment_intent_id, booking_id")
      .eq("tenant_id", tenant.id)
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (!payment?.stripe_payment_intent_id) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }

    if (payment.status === "succeeded") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(
      payment.stripe_payment_intent_id,
    );

    if (intent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment has not succeeded yet." },
        { status: 409 },
      );
    }

    const result = await confirmBookingPayment({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      bookingId,
      stripePaymentIntentId: intent.id,
      stripeChargeId:
        typeof intent.latest_charge === "string"
          ? intent.latest_charge
          : intent.latest_charge?.id ?? null,
      paidAt: new Date(intent.created * 1000).toISOString(),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
