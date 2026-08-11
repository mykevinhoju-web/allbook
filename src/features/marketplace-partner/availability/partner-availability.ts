import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

import { mapAvailability } from "../mappers";
import type {
  PartnerAvailabilityInput,
  PartnerAvailabilityRule,
} from "../types";

type ServiceClient = SupabaseClient<Database>;

export async function getPartnerAvailability(args: {
  supabase: ServiceClient;
  partnerId: string;
}): Promise<PartnerAvailabilityRule | null> {
  const { data, error } = await args.supabase
    .from("partner_availability_rules")
    .select("*")
    .eq("partner_id", args.partnerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAvailability(data) : null;
}

/** Upsert the single availability rule row for a partner. */
export async function upsertPartnerAvailability(args: {
  supabase: ServiceClient;
  partnerId: string;
  input: PartnerAvailabilityInput;
}): Promise<PartnerAvailabilityRule> {
  const existing = await getPartnerAvailability(args);
  const payload = {
    partner_id: args.partnerId,
    timezone: args.input.timezone?.trim() || "Australia/Brisbane",
    weekly_windows: (args.input.weeklyWindows ?? []) as Json,
    blackouts: (args.input.blackouts ?? []) as Json,
    capacity_per_slot: args.input.capacityPerSlot ?? 1,
  };

  if (existing) {
    const { data, error } = await args.supabase
      .from("partner_availability_rules")
      .update({
        timezone: payload.timezone,
        weekly_windows: payload.weekly_windows,
        blackouts: payload.blackouts,
        capacity_per_slot: payload.capacity_per_slot,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapAvailability(data);
  }

  const { data, error } = await args.supabase
    .from("partner_availability_rules")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapAvailability(data);
}
