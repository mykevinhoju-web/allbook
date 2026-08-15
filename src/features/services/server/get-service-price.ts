import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  applyPricingAdjustments,
  mergePricingAdjustments,
  parsePricingAdjustments,
  type BookingPriceBreakdown,
  type BookingPriceChannel,
  type PricingAdjustments,
} from "../lib/pricing-adjustments";

export async function getServicePriceCents(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  durationMinutes: number,
): Promise<number | null> {
  const option = await getServiceOptionPricing(
    supabase,
    tenantId,
    durationMinutes,
  );
  return option?.priceCents ?? null;
}

export async function getServiceOptionPricing(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  durationMinutes: number,
): Promise<{ priceCents: number; staffPayoutCents: number } | null> {
  const { data } = await supabase
    .from("service_options")
    .select("price_cents, staff_payout_cents")
    .eq("tenant_id", tenantId)
    .eq("duration_minutes", durationMinutes)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;
  return {
    priceCents: data.price_cents,
    staffPayoutCents: Math.max(0, data.staff_payout_cents ?? 0),
  };
}

export async function loadStaffPayoutByDuration(
  supabase: SupabaseClient<Database>,
  tenantId: string,
): Promise<Map<number, number>> {
  const { data } = await supabase
    .from("service_options")
    .select("duration_minutes, staff_payout_cents")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  return new Map(
    (data ?? []).map((row) => [
      row.duration_minutes,
      Math.max(0, row.staff_payout_cents ?? 0),
    ]),
  );
}

export async function loadPricingAdjustments(
  supabase: SupabaseClient<Database>,
  tenantId: string,
): Promise<PricingAdjustments> {
  const { data } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  const settings =
    data?.settings && typeof data.settings === "object" && !Array.isArray(data.settings)
      ? (data.settings as Record<string, unknown>)
      : {};

  return mergePricingAdjustments(
    parsePricingAdjustments(settings.pricingAdjustments),
  );
}

/** Base service price + night surcharge − channel discount. */
export async function computeBookingPriceCents(
  supabase: SupabaseClient<Database>,
  args: {
    tenantId: string;
    durationMinutes: number;
    startsAtIso: string;
    timeZone: string;
    channel: BookingPriceChannel;
    adjustments?: PricingAdjustments;
    paymentMethod?: "cash" | "card" | null;
  },
): Promise<BookingPriceBreakdown | null> {
  const option = await getServiceOptionPricing(
    supabase,
    args.tenantId,
    args.durationMinutes,
  );
  if (option === null) return null;

  const adjustments =
    args.adjustments ??
    (await loadPricingAdjustments(supabase, args.tenantId));

  const priced = applyPricingAdjustments({
    baseCents: option.priceCents,
    startsAtIso: args.startsAtIso,
    timeZone: args.timeZone,
    channel: args.channel,
    adjustments,
    paymentMethod: args.paymentMethod,
  });

  return {
    ...priced,
    staffPayoutCents: option.staffPayoutCents,
  };
}
