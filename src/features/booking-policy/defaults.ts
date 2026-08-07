import type {
  CaptureMode,
  PaymentMode,
  RefundMode,
  SalonBookingPolicy,
  SalonBookingPolicyInput,
} from "./types";

/**
 * Default policy for every new business.
 * Bookings work immediately — online payment stays off until the owner enables it.
 */
export function createDefaultBookingPolicyInput(): SalonBookingPolicyInput {
  return {
    bookingEnabled: true,
    allowWalkIns: true,
    appointmentOnly: false,
    approvalRequired: false,
    instantConfirmation: true,
    maxAdvanceBookingDays: 90,
    minNoticeHours: 2,
    paymentMode: "booking_only",
    depositAmountCents: null,
    depositPercent: null,
    currency: "AUD",
    captureMode: "none",
    remainingBalanceInSalon: true,
    onlinePaymentEnabled: false,
    cancellationWindowHours: 24,
    cancellationRefundPercent: 100,
    depositForfeiturePercent: 0,
    noShowAction: "record_only",
    noShowFeeCents: null,
    refundMode: "none",
  };
}

export const PAYMENT_MODE_OPTIONS: Array<{
  value: PaymentMode;
  label: string;
  description: string;
}> = [
  {
    value: "booking_only",
    label: "Booking only",
    description: "Accept bookings with no online payment.",
  },
  {
    value: "fixed_deposit",
    label: "Fixed deposit",
    description: "Collect a fixed deposit amount (e.g. $20).",
  },
  {
    value: "percentage_deposit",
    label: "Percentage deposit",
    description: "Collect a percent of the service price (e.g. 30%).",
  },
  {
    value: "full_prepayment",
    label: "Full prepayment",
    description: "Collect 100% before the appointment.",
  },
  {
    value: "card_hold",
    label: "Card hold",
    description: "Authorise a card; charge only for no-shows (gateway later).",
  },
];

export const CAPTURE_MODE_OPTIONS: Array<{
  value: CaptureMode;
  label: string;
}> = [
  { value: "none", label: "No capture" },
  { value: "immediate", label: "Immediate payment" },
  { value: "deposit", label: "Deposit only" },
  { value: "automatic_capture", label: "Automatic capture" },
  { value: "manual_capture", label: "Manual capture" },
  { value: "card_hold", label: "Card hold" },
];

export const REFUND_MODE_OPTIONS: Array<{
  value: RefundMode;
  label: string;
}> = [
  { value: "none", label: "No online refund required" },
  { value: "full", label: "Full refund" },
  { value: "partial", label: "Partial refund" },
  { value: "policy_based", label: "Based on cancellation window" },
];

export const CANCELLATION_PRESETS = [24, 48, 72] as const;

export function cancellationPresetOf(
  hours: number,
): 24 | 48 | 72 | "custom" {
  if (hours === 24 || hours === 48 || hours === 72) return hours;
  return "custom";
}

export function syncCaptureModeForPaymentMode(
  mode: PaymentMode,
): CaptureMode {
  switch (mode) {
    case "booking_only":
      return "none";
    case "fixed_deposit":
    case "percentage_deposit":
      return "deposit";
    case "full_prepayment":
      return "immediate";
    case "card_hold":
      return "card_hold";
    default:
      return "none";
  }
}

export function formatMoneyCents(
  cents: number,
  currency = "AUD",
): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function policyToInput(
  policy: SalonBookingPolicy,
): SalonBookingPolicyInput {
  return {
    bookingEnabled: policy.bookingEnabled,
    allowWalkIns: policy.allowWalkIns,
    appointmentOnly: policy.appointmentOnly,
    approvalRequired: policy.approvalRequired,
    instantConfirmation: policy.instantConfirmation,
    maxAdvanceBookingDays: policy.maxAdvanceBookingDays,
    minNoticeHours: policy.minNoticeHours,
    paymentMode: policy.paymentMode,
    depositAmountCents: policy.depositAmountCents,
    depositPercent: policy.depositPercent,
    currency: policy.currency,
    captureMode: policy.captureMode,
    remainingBalanceInSalon: policy.remainingBalanceInSalon,
    onlinePaymentEnabled: policy.onlinePaymentEnabled,
    cancellationWindowHours: policy.cancellationWindowHours,
    cancellationRefundPercent: policy.cancellationRefundPercent,
    depositForfeiturePercent: policy.depositForfeiturePercent,
    noShowAction: policy.noShowAction,
    noShowFeeCents: policy.noShowFeeCents,
    refundMode: policy.refundMode,
  };
}
