import type { Json } from "@/types/database";

import type {
  CaptureMode,
  NoShowAction,
  PaymentMode,
  PaymentProviderKind,
  RefundMode,
  SalonBookingPolicy,
  ServicePolicyOverride,
} from "./types";

type PolicyRow = {
  salon_id: string;
  booking_enabled: boolean;
  allow_walk_ins: boolean;
  appointment_only: boolean;
  approval_required: boolean;
  instant_confirmation: boolean;
  max_advance_booking_days: number;
  min_notice_hours: number;
  payment_mode: PaymentMode;
  deposit_amount_cents: number | null;
  deposit_percent: number | string | null;
  currency: string;
  capture_mode: CaptureMode;
  remaining_balance_in_salon: boolean;
  online_payment_enabled: boolean;
  cancellation_window_hours: number;
  cancellation_refund_percent: number | string;
  deposit_forfeiture_percent: number | string;
  no_show_action: NoShowAction;
  no_show_fee_cents: number | null;
  refund_mode: RefundMode;
  payment_provider: PaymentProviderKind | null;
  provider_config: Json;
  extensions: Json;
  version: number;
  updated_at: string;
};

type OverrideRow = {
  service_id: string;
  salon_id: string;
  enabled: boolean;
  payment_mode: PaymentMode | null;
  deposit_amount_cents: number | null;
  deposit_percent: number | string | null;
  capture_mode: CaptureMode | null;
  cancellation_window_hours: number | null;
  cancellation_refund_percent: number | string | null;
  deposit_forfeiture_percent: number | string | null;
  no_show_action: NoShowAction | null;
  no_show_fee_cents: number | null;
  refund_mode: RefundMode | null;
  online_payment_enabled: boolean | null;
  extensions: Json;
};

function asRecord(value: Json): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function num(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapPolicyRow(row: PolicyRow): SalonBookingPolicy {
  return {
    salonId: row.salon_id,
    bookingEnabled: row.booking_enabled,
    allowWalkIns: row.allow_walk_ins,
    appointmentOnly: row.appointment_only,
    approvalRequired: row.approval_required,
    instantConfirmation: row.instant_confirmation,
    maxAdvanceBookingDays: row.max_advance_booking_days,
    minNoticeHours: row.min_notice_hours,
    paymentMode: row.payment_mode,
    depositAmountCents: row.deposit_amount_cents,
    depositPercent: num(row.deposit_percent),
    currency: row.currency,
    captureMode: row.capture_mode,
    remainingBalanceInSalon: row.remaining_balance_in_salon,
    onlinePaymentEnabled: row.online_payment_enabled,
    cancellationWindowHours: row.cancellation_window_hours,
    cancellationRefundPercent: num(row.cancellation_refund_percent) ?? 100,
    depositForfeiturePercent: num(row.deposit_forfeiture_percent) ?? 0,
    noShowAction: row.no_show_action,
    noShowFeeCents: row.no_show_fee_cents,
    refundMode: row.refund_mode,
    paymentProvider: row.payment_provider,
    providerConfig: asRecord(row.provider_config),
    extensions: asRecord(row.extensions),
    version: row.version,
    updatedAt: row.updated_at,
  };
}

export function mapOverrideRow(row: OverrideRow): ServicePolicyOverride {
  return {
    serviceId: row.service_id,
    salonId: row.salon_id,
    enabled: row.enabled,
    paymentMode: row.payment_mode,
    depositAmountCents: row.deposit_amount_cents,
    depositPercent: num(row.deposit_percent),
    captureMode: row.capture_mode,
    cancellationWindowHours: row.cancellation_window_hours,
    cancellationRefundPercent: num(row.cancellation_refund_percent),
    depositForfeiturePercent: num(row.deposit_forfeiture_percent),
    noShowAction: row.no_show_action,
    noShowFeeCents: row.no_show_fee_cents,
    refundMode: row.refund_mode,
    onlinePaymentEnabled: row.online_payment_enabled,
    extensions: asRecord(row.extensions),
  };
}
