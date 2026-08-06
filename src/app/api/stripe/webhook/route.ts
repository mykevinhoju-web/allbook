import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  confirmBookingPayment,
  failBookingPayment,
} from "@/features/booking/server/confirm-booking-payment";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();

  if (!webhookSecret) {
    return NextResponse.json(
      {
        error: "Stripe webhook is not configured.",
        hint: "Add STRIPE_WEBHOOK_SECRET in Vercel and create a webhook endpoint at https://allbook.com.au/api/stripe/webhook for payment_intent.succeeded and payment_intent.payment_failed.",
      },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const bookingId = intent.metadata.bookingId;
        const tenantId = intent.metadata.tenantId;
        const tenantSlug = intent.metadata.tenantSlug;

        if (!bookingId || !tenantId || !tenantSlug) {
          break;
        }

        await confirmBookingPayment({
          tenantId,
          tenantSlug,
          bookingId,
          stripePaymentIntentId: intent.id,
          stripeChargeId:
            typeof intent.latest_charge === "string"
              ? intent.latest_charge
              : intent.latest_charge?.id ?? null,
          paidAt: new Date(intent.created * 1000).toISOString(),
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const bookingId = intent.metadata.bookingId;
        const tenantId = intent.metadata.tenantId;

        if (!bookingId || !tenantId) {
          break;
        }

        await failBookingPayment({
          tenantId,
          bookingId,
          stripePaymentIntentId: intent.id,
          failureMessage: intent.last_payment_error?.message,
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
