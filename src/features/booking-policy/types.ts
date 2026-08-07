/**
 * Booking & Payment Policy Engine — permanent architecture.
 *
 * Gateways (Stripe Connect, Square, Tyro, PayPal, gift cards, loyalty,
 * memberships, promo codes, packages, split payments, invoices, tax,
 * settlement) attach via `paymentProvider` + `providerConfig` + `extensions`
 * without redesigning this model. No gateway is required to accept bookings.
 */

export type PaymentMode =
  | "booking_only"
  | "fixed_deposit"
  | "percentage_deposit"
  | "full_prepayment"
  | "card_hold";

export type CaptureMode =
  | "none"
  | "immediate"
  | "deposit"
  | "automatic_capture"
  | "manual_capture"
  | "card_hold";

export type NoShowAction = "record_only" | "fee" | "charge_hold";

export type RefundMode = "none" | "full" | "partial" | "policy_based";

/** Future-compatible provider slot — unused until a gateway is connected. */
export type PaymentProviderKind =
  | "stripe_connect"
  | "square"
  | "tyro"
  | "paypal"
  | "gift_card"
  | "loyalty"
  | "membership"
  | "promo"
  | "package"
  | "invoice"
  | "manual";

export type CancellationWindowPreset = 24 | 48 | 72 | "custom";

export type SalonBookingPolicy = {
  salonId: string;
  bookingEnabled: boolean;
  allowWalkIns: boolean;
  appointmentOnly: boolean;
  approvalRequired: boolean;
  instantConfirmation: boolean;
  maxAdvanceBookingDays: number;
  minNoticeHours: number;
  paymentMode: PaymentMode;
  depositAmountCents: number | null;
  depositPercent: number | null;
  currency: string;
  captureMode: CaptureMode;
  remainingBalanceInSalon: boolean;
  onlinePaymentEnabled: boolean;
  cancellationWindowHours: number;
  cancellationRefundPercent: number;
  depositForfeiturePercent: number;
  noShowAction: NoShowAction;
  noShowFeeCents: number | null;
  refundMode: RefundMode;
  paymentProvider: PaymentProviderKind | null;
  providerConfig: Record<string, unknown>;
  extensions: Record<string, unknown>;
  version: number;
  updatedAt: string;
};

export type ServicePolicyOverride = {
  serviceId: string;
  salonId: string;
  enabled: boolean;
  paymentMode: PaymentMode | null;
  depositAmountCents: number | null;
  depositPercent: number | null;
  captureMode: CaptureMode | null;
  cancellationWindowHours: number | null;
  cancellationRefundPercent: number | null;
  depositForfeiturePercent: number | null;
  noShowAction: NoShowAction | null;
  noShowFeeCents: number | null;
  refundMode: RefundMode | null;
  onlinePaymentEnabled: boolean | null;
  extensions: Record<string, unknown>;
};

/** Fields a service may override (null = inherit business policy). */
export type ServicePolicyOverrideInput = {
  enabled: boolean;
  paymentMode?: PaymentMode | null;
  depositAmountCents?: number | null;
  depositPercent?: number | null;
  captureMode?: CaptureMode | null;
  cancellationWindowHours?: number | null;
  cancellationRefundPercent?: number | null;
  depositForfeiturePercent?: number | null;
  noShowAction?: NoShowAction | null;
  noShowFeeCents?: number | null;
  refundMode?: RefundMode | null;
  onlinePaymentEnabled?: boolean | null;
};

export type SalonBookingPolicyInput = {
  bookingEnabled: boolean;
  allowWalkIns: boolean;
  appointmentOnly: boolean;
  approvalRequired: boolean;
  instantConfirmation: boolean;
  maxAdvanceBookingDays: number;
  minNoticeHours: number;
  paymentMode: PaymentMode;
  depositAmountCents: number | null;
  depositPercent: number | null;
  currency: string;
  captureMode: CaptureMode;
  remainingBalanceInSalon: boolean;
  onlinePaymentEnabled: boolean;
  cancellationWindowHours: number;
  cancellationRefundPercent: number;
  depositForfeiturePercent: number;
  noShowAction: NoShowAction;
  noShowFeeCents: number | null;
  refundMode: RefundMode;
};

export type ResolvedPolicy = {
  salonId: string;
  serviceId: string | null;
  source: "business" | "service_override";
  bookingEnabled: boolean;
  allowWalkIns: boolean;
  appointmentOnly: boolean;
  approvalRequired: boolean;
  instantConfirmation: boolean;
  maxAdvanceBookingDays: number;
  minNoticeHours: number;
  paymentMode: PaymentMode;
  depositAmountCents: number | null;
  depositPercent: number | null;
  currency: string;
  captureMode: CaptureMode;
  remainingBalanceInSalon: boolean;
  onlinePaymentEnabled: boolean;
  cancellationWindowHours: number;
  cancellationRefundPercent: number;
  depositForfeiturePercent: number;
  noShowAction: NoShowAction;
  noShowFeeCents: number | null;
  refundMode: RefundMode;
  paymentProvider: PaymentProviderKind | null;
  /** Due online now (cents). 0 when booking_only / no online payment. */
  amountDueOnlineCents: number;
  servicePriceCents: number;
  requiresOnlinePayment: boolean;
  requiresCardHold: boolean;
  customerSummary: PolicyCustomerSummary;
  version: number;
};

export type PolicyCustomerSummary = {
  bookingPolicy: string;
  cancellationPolicy: string;
  depositPolicy: string;
  refundPolicy: string;
  noShowPolicy: string;
};

export type PolicyAcceptance = {
  accepted: boolean;
  acceptedAt: string | null;
  snapshot: ResolvedPolicy | null;
};
