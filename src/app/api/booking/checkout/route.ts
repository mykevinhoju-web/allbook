import { NextResponse } from "next/server";

import {
  isValidAuMobile,
  isValidAuPostcode,
  normalizeAuMobile,
  formatAuPostcodeInput,
} from "@/features/booking/lib/au-contact";
import {
  CreateBookingError,
  createTenantBooking,
} from "@/features/booking/server/create-booking";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { getStripe, getStripePublishableKey } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const publishableKey = getStripePublishableKey();

    if (!publishableKey || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Card payments are not configured yet." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      staffId?: string;
      startsAt?: string;
      durationMinutes?: number;
      customerName?: string;
      customerPhone?: string;
      customerPostcode?: string;
      customerEmail?: string;
    };

    if (!body.staffId || !body.startsAt || !body.durationMinutes) {
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
        { error: "Enter a valid 4-digit Australian postcode." },
        { status: 400 },
      );
    }

    const booking = await createTenantBooking(tenant, {
      staffId: body.staffId,
      startsAt: body.startsAt,
      durationMinutes: body.durationMinutes,
      customerName: body.customerName,
      customerPhone: normalizeAuMobile(body.customerPhone),
      customerPostcode: formatAuPostcodeInput(body.customerPostcode),
      customerEmail: body.customerEmail,
      status: "pending",
      paymentStatus: "unpaid",
      notify: false,
      pricingChannel: "external",
    });

    const stripe = getStripe();
    const currency = (tenant.settings.currency || "AUD").toLowerCase();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.priceCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: booking.id,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      },
      description: `${tenant.branding.displayName} · ${booking.staffName}`,
    });

    const supabase = createServiceSupabase();
    const { error: paymentError } = await supabase.from("payments").insert({
      tenant_id: tenant.id,
      booking_id: booking.id,
      amount_cents: booking.priceCents,
      currency: currency.toUpperCase(),
      status: "pending",
      stripe_payment_intent_id: paymentIntent.id,
    });

    if (paymentError) {
      await supabase
        .from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", booking.id)
        .eq("tenant_id", tenant.id);

      return NextResponse.json(
        { error: paymentError.message },
        { status: 503 },
      );
    }

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Could not start payment." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
      publishableKey,
      amountCents: booking.priceCents,
      currency: currency.toUpperCase(),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof CreateBookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
