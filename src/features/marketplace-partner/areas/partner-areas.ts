import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { mapPartnerArea } from "../mappers";
import type { PartnerAreaInput, PartnerAreaMode, PartnerServiceArea } from "../types";

type ServiceClient = SupabaseClient<Database>;

const MODES: PartnerAreaMode[] = ["suburb", "radius", "postcodes"];

function validateArea(input: PartnerAreaInput): void {
  if (!MODES.includes(input.mode)) throw new Error("Invalid area mode.");
  if (input.mode === "suburb" && !input.suburbId) {
    throw new Error("suburbId is required for suburb mode.");
  }
  if (input.mode === "radius") {
    if (
      input.centerLat == null ||
      input.centerLng == null ||
      input.radiusKm == null
    ) {
      throw new Error("centerLat, centerLng, and radiusKm are required.");
    }
  }
  if (input.mode === "postcodes") {
    if (!input.postcodes?.length) {
      throw new Error("postcodes are required for postcodes mode.");
    }
  }
}

export async function listPartnerAreas(args: {
  supabase: ServiceClient;
  partnerId: string;
}): Promise<PartnerServiceArea[]> {
  const { data, error } = await args.supabase
    .from("partner_service_areas")
    .select("*")
    .eq("partner_id", args.partnerId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPartnerArea);
}

export async function createPartnerArea(args: {
  supabase: ServiceClient;
  partnerId: string;
  input: PartnerAreaInput;
}): Promise<PartnerServiceArea> {
  validateArea(args.input);

  if (args.input.serviceId) {
    const { data: svc } = await args.supabase
      .from("partner_services")
      .select("id")
      .eq("id", args.input.serviceId)
      .eq("partner_id", args.partnerId)
      .maybeSingle();
    if (!svc) throw new Error("serviceId does not belong to this partner.");
  }

  const { data, error } = await args.supabase
    .from("partner_service_areas")
    .insert({
      partner_id: args.partnerId,
      service_id: args.input.serviceId ?? null,
      mode: args.input.mode,
      suburb_id: args.input.suburbId ?? null,
      center_lat: args.input.centerLat ?? null,
      center_lng: args.input.centerLng ?? null,
      radius_km: args.input.radiusKm ?? null,
      postcodes: args.input.postcodes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPartnerArea(data);
}

export async function deletePartnerArea(args: {
  supabase: ServiceClient;
  partnerId: string;
  areaId: string;
}): Promise<void> {
  const { error } = await args.supabase
    .from("partner_service_areas")
    .delete()
    .eq("id", args.areaId)
    .eq("partner_id", args.partnerId);
  if (error) throw new Error(error.message);
}
