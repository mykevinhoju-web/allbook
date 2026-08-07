import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

import { createDefaultBookingPolicyInput } from "./defaults";
import { mapOverrideRow, mapPolicyRow } from "./map";
import { resolveBookingPolicy } from "./resolve";
import type {
  ResolvedPolicy,
  SalonBookingPolicy,
  SalonBookingPolicyInput,
  ServicePolicyOverride,
  ServicePolicyOverrideInput,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

const POLICY_SELECT = "*";

/**
 * Ensure a salon has the default Booking Only policy.
 * Safe to call on create / first settings load.
 */
export async function ensureDefaultBookingPolicy(
  supabase: AnySupabase,
  salonId: string,
): Promise<SalonBookingPolicy> {
  const existing = await getSalonBookingPolicy(supabase, salonId);
  if (existing) return existing;

  const defaults = createDefaultBookingPolicyInput();
  const { data, error } = await supabase
    .from("salon_booking_policies")
    .insert({
      salon_id: salonId,
      booking_enabled: defaults.bookingEnabled,
      allow_walk_ins: defaults.allowWalkIns,
      appointment_only: defaults.appointmentOnly,
      approval_required: defaults.approvalRequired,
      instant_confirmation: defaults.instantConfirmation,
      max_advance_booking_days: defaults.maxAdvanceBookingDays,
      min_notice_hours: defaults.minNoticeHours,
      payment_mode: defaults.paymentMode,
      deposit_amount_cents: defaults.depositAmountCents,
      deposit_percent: defaults.depositPercent,
      currency: defaults.currency,
      capture_mode: defaults.captureMode,
      remaining_balance_in_salon: defaults.remainingBalanceInSalon,
      online_payment_enabled: defaults.onlinePaymentEnabled,
      cancellation_window_hours: defaults.cancellationWindowHours,
      cancellation_refund_percent: defaults.cancellationRefundPercent,
      deposit_forfeiture_percent: defaults.depositForfeiturePercent,
      no_show_action: defaults.noShowAction,
      no_show_fee_cents: defaults.noShowFeeCents,
      refund_mode: defaults.refundMode,
    })
    .select(POLICY_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create default booking policy.");
  }

  // Keep salons.booking_enabled aligned with policy default.
  await supabase
    .from("salons")
    .update({
      booking_enabled: defaults.bookingEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", salonId);

  return mapPolicyRow(data as never);
}

export async function getSalonBookingPolicy(
  supabase: AnySupabase,
  salonId: string,
): Promise<SalonBookingPolicy | null> {
  const { data, error } = await supabase
    .from("salon_booking_policies")
    .select(POLICY_SELECT)
    .eq("salon_id", salonId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapPolicyRow(data as never);
}

export async function updateSalonBookingPolicy(
  supabase: AnySupabase,
  salonId: string,
  input: SalonBookingPolicyInput,
): Promise<SalonBookingPolicy> {
  const validation = validatePolicyInput(input);
  if (validation) throw new Error(validation);

  await ensureDefaultBookingPolicy(supabase, salonId);

  const now = new Date().toISOString();
  const { data: current } = await supabase
    .from("salon_booking_policies")
    .select("version")
    .eq("salon_id", salonId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("salon_booking_policies")
    .update({
      booking_enabled: input.bookingEnabled,
      allow_walk_ins: input.allowWalkIns,
      appointment_only: input.appointmentOnly,
      approval_required: input.approvalRequired,
      instant_confirmation: input.instantConfirmation,
      max_advance_booking_days: input.maxAdvanceBookingDays,
      min_notice_hours: input.minNoticeHours,
      payment_mode: input.paymentMode,
      deposit_amount_cents: input.depositAmountCents,
      deposit_percent: input.depositPercent,
      currency: input.currency,
      capture_mode: input.captureMode,
      remaining_balance_in_salon: input.remainingBalanceInSalon,
      online_payment_enabled: input.onlinePaymentEnabled,
      cancellation_window_hours: input.cancellationWindowHours,
      cancellation_refund_percent: input.cancellationRefundPercent,
      deposit_forfeiture_percent: input.depositForfeiturePercent,
      no_show_action: input.noShowAction,
      no_show_fee_cents: input.noShowFeeCents,
      refund_mode: input.refundMode,
      version: (current?.version ?? 1) + 1,
      updated_at: now,
    })
    .eq("salon_id", salonId)
    .select(POLICY_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update booking policy.");
  }

  await supabase
    .from("salons")
    .update({
      booking_enabled: input.bookingEnabled,
      updated_at: now,
    })
    .eq("id", salonId);

  return mapPolicyRow(data as never);
}

export async function getServicePolicyOverride(
  supabase: AnySupabase,
  serviceId: string,
): Promise<ServicePolicyOverride | null> {
  const { data, error } = await supabase
    .from("salon_service_policy_overrides")
    .select("*")
    .eq("service_id", serviceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapOverrideRow(data as never);
}

export async function upsertServicePolicyOverride(
  supabase: AnySupabase,
  salonId: string,
  serviceId: string,
  input: ServicePolicyOverrideInput,
): Promise<ServicePolicyOverride> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("salon_service_policy_overrides")
    .upsert(
      {
        service_id: serviceId,
        salon_id: salonId,
        enabled: input.enabled,
        payment_mode: input.paymentMode ?? null,
        deposit_amount_cents: input.depositAmountCents ?? null,
        deposit_percent: input.depositPercent ?? null,
        capture_mode: input.captureMode ?? null,
        cancellation_window_hours: input.cancellationWindowHours ?? null,
        cancellation_refund_percent: input.cancellationRefundPercent ?? null,
        deposit_forfeiture_percent: input.depositForfeiturePercent ?? null,
        no_show_action: input.noShowAction ?? null,
        no_show_fee_cents: input.noShowFeeCents ?? null,
        refund_mode: input.refundMode ?? null,
        online_payment_enabled: input.onlinePaymentEnabled ?? null,
        updated_at: now,
      },
      { onConflict: "service_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save service policy override.");
  }
  return mapOverrideRow(data as never);
}

export async function resolvePolicyForBooking(
  supabase: AnySupabase,
  input: {
    salonId: string;
    serviceId?: string | null;
    servicePrice?: number;
  },
): Promise<ResolvedPolicy> {
  const business = await ensureDefaultBookingPolicy(supabase, input.salonId);
  const override = input.serviceId
    ? await getServicePolicyOverride(supabase, input.serviceId)
    : null;
  return resolveBookingPolicy({
    business,
    override,
    serviceId: input.serviceId,
    servicePrice: input.servicePrice,
  });
}

export function validatePolicyInput(
  input: SalonBookingPolicyInput,
): string | null {
  if (input.maxAdvanceBookingDays < 1 || input.maxAdvanceBookingDays > 730) {
    return "Maximum advance booking must be between 1 and 730 days.";
  }
  if (input.minNoticeHours < 0 || input.minNoticeHours > 168) {
    return "Minimum notice must be between 0 and 168 hours.";
  }
  if (input.cancellationWindowHours < 0) {
    return "Cancellation window must be zero or greater.";
  }
  if (
    input.paymentMode === "fixed_deposit" &&
    (input.depositAmountCents == null || input.depositAmountCents <= 0)
  ) {
    return "Fixed deposit requires a deposit amount greater than zero.";
  }
  if (
    input.paymentMode === "percentage_deposit" &&
    (input.depositPercent == null ||
      input.depositPercent <= 0 ||
      input.depositPercent > 100)
  ) {
    return "Percentage deposit must be between 1 and 100.";
  }
  if (
    input.onlinePaymentEnabled &&
    input.paymentMode !== "booking_only" &&
    !input.paymentMode
  ) {
    return "Select a payment mode when online payment is enabled.";
  }
  // Online payment can be configured in policy before a gateway is connected.
  // Charging remains blocked until a provider is attached (future).
  return null;
}

export function snapshotToJson(policy: ResolvedPolicy): Json {
  return JSON.parse(JSON.stringify(policy)) as Json;
}
