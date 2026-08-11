import type { SupabaseClient } from "@supabase/supabase-js";

import { ownerOwnsSalon } from "@/features/dashboard/getOwnerSalon";
import type { Database } from "@/types/database";

import { mapPartner } from "./mappers";
import type { CreatePartnerInput, MarketplacePartner } from "./types";

type ServiceClient = SupabaseClient<Database>;

function normalizePricingHint(input: CreatePartnerInput): void {
  const name = input.displayName?.trim();
  if (!name) {
    throw new Error("displayName is required.");
  }
}

/**
 * Create a Partner application (status=pending).
 * Never invents services/prices from Google.
 */
export async function createPartnerApplication(args: {
  supabase: ServiceClient;
  authUserId: string;
  input: CreatePartnerInput;
}): Promise<MarketplacePartner> {
  const { supabase, authUserId, input } = args;
  normalizePricingHint(input);

  const partnerType = input.partnerType;
  if (partnerType !== "business_linked" && partnerType !== "independent") {
    throw new Error("Invalid partnerType.");
  }

  const existing = await supabase
    .from("marketplace_partners")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (existing.data?.id) {
    throw new Error("You already have a Partner application.");
  }

  let salonId: string | null = null;
  if (partnerType === "business_linked") {
    if (!input.salonId) {
      throw new Error("salonId is required for business_linked partners.");
    }
    const owns = await ownerOwnsSalon(authUserId, input.salonId);
    if (!owns) {
      throw new Error("You must own the linked business to apply as Partner.");
    }
    const taken = await supabase
      .from("marketplace_partners")
      .select("id")
      .eq("salon_id", input.salonId)
      .maybeSingle();
    if (taken.data?.id) {
      throw new Error("This business is already linked to a Partner.");
    }
    salonId = input.salonId;
  } else if (input.salonId) {
    throw new Error("independent partners cannot link a salon_id.");
  }

  const { data, error } = await supabase
    .from("marketplace_partners")
    .insert({
      auth_user_id: authUserId,
      partner_type: partnerType,
      salon_id: salonId,
      status: "pending",
      display_name: input.displayName.trim(),
      bio: input.bio?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapPartner(data);
}
