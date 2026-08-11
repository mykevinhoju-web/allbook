import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

import { mapPartner } from "./mappers";
import type { MarketplacePartner } from "./types";

export class PartnerAuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "PartnerAuthError";
  }
}

type ServiceClient = SupabaseClient<Database>;

export async function requireAuthUser(): Promise<User> {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    throw new PartnerAuthError("Sign in required.", 401);
  }
  return user;
}

export async function getPartnerByAuthUserId(
  authUserId: string,
  supabase: ServiceClient = createServiceSupabase(),
): Promise<MarketplacePartner | null> {
  const { data, error } = await supabase
    .from("marketplace_partners")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPartner(data) : null;
}

export async function getPartnerById(
  partnerId: string,
  supabase: ServiceClient = createServiceSupabase(),
): Promise<MarketplacePartner | null> {
  const { data, error } = await supabase
    .from("marketplace_partners")
    .select("*")
    .eq("id", partnerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPartner(data) : null;
}

/** Ensures the session user owns this partner_id. */
export async function requirePartnerOwner(
  partnerId: string,
): Promise<{ user: User; partner: MarketplacePartner; supabase: ServiceClient }> {
  const user = await requireAuthUser();
  const supabase = createServiceSupabase();
  const partner = await getPartnerById(partnerId, supabase);
  if (!partner || partner.authUserId !== user.id) {
    throw new PartnerAuthError("Forbidden.", 403);
  }
  return { user, partner, supabase };
}
