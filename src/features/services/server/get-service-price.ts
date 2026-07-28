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
  const { data } = await supabase
    .from("service_options")
    .select("price_cents")
    .eq("tenant_id", tenantId)
    .eq("duration_minutes", durationMinutes)
    .eq("is_active", true)
    .maybeSingle();

  return data?.price_cents ?? null;
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
  const baseCents = await getServicePriceCents(
    supabase,
    args.tenantId,
    args.durationMinutes,
  );
  if (baseCents === null) return null;

  const adjustments =
    args.adjustments ??
    (await loadPricingAdjustments(supabase, args.tenantId));

  return applyPricingAdjustments({
    baseCents,
    startsAtIso: args.startsAtIso,
    timeZone: args.timeZone,
    channel: args.channel,
    adjustments,
    paymentMethod: args.paymentMethod,
  });
}
