"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";

import { cn } from "@/lib/utils";

import { bookingCustomerTheme as theme } from "../../lib/booking-customer-theme";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripePromise(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

interface StripePaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  amountLabel: string;
  disabled?: boolean;
  onSuccess: () => void;
  onError: (message: string) => void;
  buttonClassName?: string;
}

function PaymentFormInner({
  amountLabel,
  disabled,
  onSuccess,
  onError,
  buttonClassName,
}: Omit<StripePaymentFormProps, "clientSecret" | "publishableKey">) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const pay = async () => {
    if (!stripe || !elements || submitting || disabled) return;

    setSubmitting(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        onError(error.message ?? "Payment failed.");
        return;
      }

      if (
        paymentIntent?.status === "succeeded" ||
        paymentIntent?.status === "processing"
      ) {
        onSuccess();
        return;
      }

      onError("Payment was not completed.");
    } catch {
      onError("Payment could not be processed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cn(theme.panel, "text-left")}>
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>
      <button
        type="button"
        disabled={!stripe || !elements || submitting || disabled}
        onClick={() => void pay()}
        className={buttonClassName}
      >
        {submitting ? "Processing…" : `Pay ${amountLabel}`}
      </button>
    </div>
  );
}

export function StripePaymentForm({
  clientSecret,
  publishableKey,
  amountLabel,
  disabled,
  onSuccess,
  onError,
  buttonClassName,
}: StripePaymentFormProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    locale: "en",
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#A68B2A",
        borderRadius: "12px",
      },
    },
  };

  return (
    <Elements stripe={getStripePromise(publishableKey)} options={options}>
      <PaymentFormInner
        amountLabel={amountLabel}
        disabled={disabled}
        onSuccess={onSuccess}
        onError={onError}
        buttonClassName={buttonClassName}
      />
    </Elements>
  );
}
