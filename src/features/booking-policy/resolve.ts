import { formatMoneyCents } from "./defaults";
import type {
  PolicyCustomerSummary,
  ResolvedPolicy,
  SalonBookingPolicy,
  ServicePolicyOverride,
} from "./types";

function computeAmountDueOnlineCents(
  policy: Pick<
    ResolvedPolicy,
    | "paymentMode"
    | "onlinePaymentEnabled"
    | "depositAmountCents"
    | "depositPercent"
    | "servicePriceCents"
  >,
): number {
  if (!policy.onlinePaymentEnabled || policy.paymentMode === "booking_only") {
    return 0;
  }
  if (policy.paymentMode === "card_hold") {
    return 0;
  }
  if (policy.paymentMode === "full_prepayment") {
    return Math.max(0, policy.servicePriceCents);
  }
  if (policy.paymentMode === "fixed_deposit") {
    return Math.max(0, policy.depositAmountCents ?? 0);
  }
  if (policy.paymentMode === "percentage_deposit") {
    const pct = policy.depositPercent ?? 0;
    return Math.round((policy.servicePriceCents * pct) / 100);
  }
  return 0;
}

export function buildCustomerSummary(
  policy: Omit<
    ResolvedPolicy,
    "customerSummary" | "amountDueOnlineCents" | "requiresOnlinePayment" | "requiresCardHold"
  > & { amountDueOnlineCents: number },
): PolicyCustomerSummary {
  const currency = policy.currency;

  let bookingPolicy = policy.bookingEnabled
    ? "Online booking is available."
    : "Online booking is currently disabled.";
  if (policy.appointmentOnly) {
    bookingPolicy += " Appointments only (no walk-ins).";
  } else if (policy.allowWalkIns) {
    bookingPolicy += " Walk-ins are welcome when capacity allows.";
  }
  if (policy.instantConfirmation) {
    bookingPolicy += " Instant confirmation.";
  } else if (policy.approvalRequired) {
    bookingPolicy += " Salon approval is required before confirmation.";
  }
  bookingPolicy += ` Book up to ${policy.maxAdvanceBookingDays} days ahead; minimum notice ${policy.minNoticeHours} hour(s).`;

  const cancellationPolicy = `Free cancellation until ${policy.cancellationWindowHours} hours before your appointment (${policy.cancellationRefundPercent}% refund). After that, deposit forfeiture may apply (${policy.depositForfeiturePercent}%).`;

  let depositPolicy: string;
  switch (policy.paymentMode) {
    case "booking_only":
      depositPolicy =
        "No deposit required. Pay at the salon if anything is owed.";
      break;
    case "fixed_deposit":
      depositPolicy = `A fixed deposit of ${formatMoneyCents(policy.depositAmountCents ?? 0, currency)} is required to secure your booking.`;
      break;
    case "percentage_deposit":
      depositPolicy = `A ${policy.depositPercent ?? 0}% deposit is required to secure your booking.`;
      break;
    case "full_prepayment":
      depositPolicy = "Full prepayment is required before your appointment.";
      break;
    case "card_hold":
      depositPolicy =
        "A card hold may be placed. You are not charged unless you no-show (when card payments are enabled).";
      break;
    default:
      depositPolicy = "No deposit required.";
  }
  if (policy.remainingBalanceInSalon && policy.paymentMode !== "full_prepayment") {
    depositPolicy += " Any remaining balance is paid at the salon.";
  }
  if (policy.amountDueOnlineCents > 0) {
    depositPolicy += ` Amount due online now: ${formatMoneyCents(policy.amountDueOnlineCents, currency)}.`;
  }

  let refundPolicy: string;
  switch (policy.refundMode) {
    case "none":
      refundPolicy =
        "No online refund is required for this booking type. Salon may handle adjustments in person.";
      break;
    case "full":
      refundPolicy = "Eligible cancellations receive a full refund of online payments.";
      break;
    case "partial":
      refundPolicy = "Eligible cancellations may receive a partial refund of online payments.";
      break;
    case "policy_based":
      refundPolicy = `Refunds follow the cancellation window (${policy.cancellationRefundPercent}% within the free-cancellation period).`;
      break;
    default:
      refundPolicy = "Refunds follow salon policy.";
  }

  let noShowPolicy: string;
  switch (policy.noShowAction) {
    case "record_only":
      noShowPolicy = "No-shows are recorded for the salon (no automatic fee).";
      break;
    case "fee":
      noShowPolicy = `No-shows may incur a fee of ${formatMoneyCents(policy.noShowFeeCents ?? 0, currency)}.`;
      break;
    case "charge_hold":
      noShowPolicy =
        "A card hold may be captured if you no-show (when card payments are enabled).";
      break;
    default:
      noShowPolicy = "No-shows are recorded.";
  }

  return {
    bookingPolicy,
    cancellationPolicy,
    depositPolicy,
    refundPolicy,
    noShowPolicy,
  };
}

/**
 * Resolve effective policy for a booking.
 * Service overrides win only when enabled and field is non-null.
 */
export function resolveBookingPolicy(input: {
  business: SalonBookingPolicy;
  override?: ServicePolicyOverride | null;
  serviceId?: string | null;
  /** Service price in major units (e.g. dollars) — converted to cents. */
  servicePrice?: number;
}): ResolvedPolicy {
  const { business, override } = input;
  const useOverride = Boolean(override?.enabled);
  const servicePriceCents = Math.round((input.servicePrice ?? 0) * 100);

  const paymentMode =
    (useOverride && override?.paymentMode) || business.paymentMode;
  const depositAmountCents =
    useOverride && override?.depositAmountCents != null
      ? override.depositAmountCents
      : business.depositAmountCents;
  const depositPercent =
    useOverride && override?.depositPercent != null
      ? override.depositPercent
      : business.depositPercent;
  const captureMode =
    (useOverride && override?.captureMode) || business.captureMode;
  const onlinePaymentEnabled =
    useOverride && override?.onlinePaymentEnabled != null
      ? override.onlinePaymentEnabled
      : business.onlinePaymentEnabled;

  const base = {
    salonId: business.salonId,
    serviceId: input.serviceId ?? override?.serviceId ?? null,
    source: (useOverride ? "service_override" : "business") as
      | "business"
      | "service_override",
    bookingEnabled: business.bookingEnabled,
    allowWalkIns: business.allowWalkIns,
    appointmentOnly: business.appointmentOnly,
    approvalRequired: business.approvalRequired,
    instantConfirmation: business.instantConfirmation,
    maxAdvanceBookingDays: business.maxAdvanceBookingDays,
    minNoticeHours: business.minNoticeHours,
    paymentMode,
    depositAmountCents,
    depositPercent,
    currency: business.currency,
    captureMode,
    remainingBalanceInSalon: business.remainingBalanceInSalon,
    onlinePaymentEnabled,
    cancellationWindowHours:
      (useOverride && override?.cancellationWindowHours) ||
      business.cancellationWindowHours,
    cancellationRefundPercent:
      useOverride && override?.cancellationRefundPercent != null
        ? override.cancellationRefundPercent
        : business.cancellationRefundPercent,
    depositForfeiturePercent:
      useOverride && override?.depositForfeiturePercent != null
        ? override.depositForfeiturePercent
        : business.depositForfeiturePercent,
    noShowAction:
      (useOverride && override?.noShowAction) || business.noShowAction,
    noShowFeeCents:
      useOverride && override?.noShowFeeCents != null
        ? override.noShowFeeCents
        : business.noShowFeeCents,
    refundMode: (useOverride && override?.refundMode) || business.refundMode,
    paymentProvider: business.paymentProvider,
    servicePriceCents,
    version: business.version,
  };

  const amountDueOnlineCents = computeAmountDueOnlineCents({
    ...base,
    servicePriceCents,
  });

  const withAmount = { ...base, amountDueOnlineCents };
  return {
    ...withAmount,
    requiresOnlinePayment: amountDueOnlineCents > 0,
    requiresCardHold:
      paymentMode === "card_hold" && onlinePaymentEnabled,
    customerSummary: buildCustomerSummary(withAmount),
  };
}
