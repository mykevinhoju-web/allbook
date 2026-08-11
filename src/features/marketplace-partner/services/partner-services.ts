import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

import { mapPartnerService } from "../mappers";
import type { PartnerPricingType, PartnerService, PartnerServiceInput } from "../types";

type ServiceClient = SupabaseClient<Database>;

const PRICING: PartnerPricingType[] = ["fixed", "hourly", "from", "quote"];

function validateServiceInput(input: PartnerServiceInput): void {
  if (!input.categorySlug?.trim()) throw new Error("categorySlug is required.");
  if (!input.name?.trim()) throw new Error("name is required.");
  if (!PRICING.includes(input.pricingType)) {
    throw new Error("Invalid pricingType.");
  }

  // Prices come only from Partner input — never invent defaults from Google/AI.
  if (input.pricingType === "quote") {
    return;
  }
  if (input.priceCents == null || input.priceCents < 0) {
    throw new Error("priceCents is required for this pricing type.");
  }
  if (
    input.priceMaxCents != null &&
    input.priceCents != null &&
    input.priceMaxCents < input.priceCents
  ) {
    throw new Error("priceMaxCents must be >= priceCents.");
  }
}

function toRow(
  partnerId: string,
  input: PartnerServiceInput,
): Database["public"]["Tables"]["partner_services"]["Insert"] {
  return {
    partner_id: partnerId,
    category_slug: input.categorySlug.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    pricing_type: input.pricingType,
    price_cents: input.priceCents ?? null,
    price_max_cents: input.priceMaxCents ?? null,
    currency: input.currency?.trim() || "AUD",
    duration_minutes: input.durationMinutes ?? null,
    travel_fee_cents: input.travelFeeCents ?? null,
    min_notice_minutes: input.minNoticeMinutes ?? null,
    attributes: (input.attributes ?? {}) as Json,
    is_active: input.isActive ?? true,
  };
}

export async function listPartnerServices(args: {
  supabase: ServiceClient;
  partnerId: string;
}): Promise<PartnerService[]> {
  const { data, error } = await args.supabase
    .from("partner_services")
    .select("*")
    .eq("partner_id", args.partnerId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPartnerService);
}

export async function createPartnerService(args: {
  supabase: ServiceClient;
  partnerId: string;
  input: PartnerServiceInput;
}): Promise<PartnerService> {
  validateServiceInput(args.input);
  const { data, error } = await args.supabase
    .from("partner_services")
    .insert(toRow(args.partnerId, args.input))
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPartnerService(data);
}

export async function updatePartnerService(args: {
  supabase: ServiceClient;
  partnerId: string;
  serviceId: string;
  input: PartnerServiceInput;
}): Promise<PartnerService> {
  validateServiceInput(args.input);
  const row = toRow(args.partnerId, args.input);
  const { partner_id: _partnerId, ...patch } = row;

  const { data, error } = await args.supabase
    .from("partner_services")
    .update(patch)
    .eq("id", args.serviceId)
    .eq("partner_id", args.partnerId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPartnerService(data);
}

export async function deletePartnerService(args: {
  supabase: ServiceClient;
  partnerId: string;
  serviceId: string;
}): Promise<void> {
  const { error } = await args.supabase
    .from("partner_services")
    .delete()
    .eq("id", args.serviceId)
    .eq("partner_id", args.partnerId);
  if (error) throw new Error(error.message);
}
