import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { mapPartner } from "./mappers";
import type {
  MarketplacePartner,
  PartnerStatus,
  UpdatePartnerProfileInput,
} from "./types";

type ServiceClient = SupabaseClient<Database>;

/** Partner self-service profile update (never status / identity). */
export async function updatePartnerProfile(args: {
  supabase: ServiceClient;
  partnerId: string;
  input: UpdatePartnerProfileInput;
}): Promise<MarketplacePartner> {
  const patch: Database["public"]["Tables"]["marketplace_partners"]["Update"] =
    {};

  if (args.input.displayName !== undefined) {
    const name = args.input.displayName.trim();
    if (!name) throw new Error("displayName cannot be empty.");
    patch.display_name = name;
  }
  if (args.input.bio !== undefined) {
    patch.bio = args.input.bio?.trim() || null;
  }
  if (args.input.phone !== undefined) {
    patch.phone = args.input.phone?.trim() || null;
  }
  if (args.input.email !== undefined) {
    patch.email = args.input.email?.trim() || null;
  }

  if (Object.keys(patch).length === 0) {
    throw new Error("No profile fields to update.");
  }

  const { data, error } = await args.supabase
    .from("marketplace_partners")
    .update(patch)
    .eq("id", args.partnerId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapPartner(data);
}

/** Platform admin status changes only. */
export async function adminUpdatePartnerStatus(args: {
  supabase: ServiceClient;
  partnerId: string;
  status: PartnerStatus;
}): Promise<MarketplacePartner> {
  const allowed: PartnerStatus[] = [
    "invited",
    "pending",
    "active",
    "suspended",
  ];
  if (!allowed.includes(args.status)) {
    throw new Error("Invalid status.");
  }

  const patch: Database["public"]["Tables"]["marketplace_partners"]["Update"] =
    {
      status: args.status,
    };
  if (args.status === "active") {
    patch.verified_at = new Date().toISOString();
  }

  const { data, error } = await args.supabase
    .from("marketplace_partners")
    .update(patch)
    .eq("id", args.partnerId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapPartner(data);
}
