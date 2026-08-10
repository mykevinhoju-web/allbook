import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type AnySupabase = SupabaseClient<Database>;

export type ClaimRequestRow = {
  id: string;
  salon_id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  password_hash: string;
  status: "pending" | "approved" | "rejected";
  match_reasons: string[];
  created_new_salon: boolean;
  created_at: string;
};

/**
 * Approve a pending claim: create salon_owners on the EXISTING salon (reviews kept),
 * mark ownership verified, and optionally restore marketplace visibility for brand-new salons.
 */
export async function approveSalonClaim(
  supabase: AnySupabase,
  input: { salonId: string; actor: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: claim, error: claimError } = await supabase
    .from("salon_claim_requests" as never)
    .select(
      "id, salon_id, auth_user_id, full_name, email, password_hash, status, created_new_salon" as never,
    )
    .eq("salon_id" as never, input.salonId)
    .eq("status" as never, "pending")
    .maybeSingle();

  if (claimError) return { ok: false, error: claimError.message };
  if (!claim) {
    return { ok: false, error: "No pending claim request for this salon." };
  }

  const row = claim as unknown as ClaimRequestRow;

  const { data: existingOwner } = await supabase
    .from("salon_owners")
    .select("id")
    .eq("salon_id", input.salonId)
    .maybeSingle();

  if (existingOwner) {
    return { ok: false, error: "This salon already has an owner." };
  }

  const now = new Date().toISOString();

  const { error: ownerError } = await supabase.from("salon_owners").insert({
    salon_id: row.salon_id,
    full_name: row.full_name,
    email: row.email,
    password_hash: row.password_hash,
    auth_user_id: row.auth_user_id,
    role: "owner",
    accepted_terms_at: now,
  });

  if (ownerError) {
    return { ok: false, error: ownerError.message };
  }

  // Unlock login after approval.
  await supabase.auth.admin.updateUserById(row.auth_user_id, {
    ban_duration: "none",
  });

  const salonUpdate: Record<string, unknown> = {
    ownership_status: "verified",
    claimed: true,
    verified: true,
    review_status: "approved",
    reviewed_at: now,
    reviewed_by: input.actor,
    updated_at: now,
  };
  // Brand-new salons were hidden until approval; catalogue claims stay visible.
  if (row.created_new_salon) {
    salonUpdate.marketplace_visible = true;
  }

  const { error: salonError } = await supabase
    .from("salons")
    .update(salonUpdate)
    .eq("id", input.salonId);

  if (salonError) {
    await supabase.from("salon_owners").delete().eq("salon_id", input.salonId);
    return { ok: false, error: salonError.message };
  }

  const { error: claimUpdateError } = await supabase
    .from("salon_claim_requests" as never)
    .update({
      status: "approved",
      reviewed_at: now,
      reviewed_by: input.actor,
      updated_at: now,
    } as never)
    .eq("id" as never, row.id);

  if (claimUpdateError) {
    return { ok: false, error: claimUpdateError.message };
  }

  return { ok: true };
}

export async function rejectSalonClaim(
  supabase: AnySupabase,
  input: { salonId: string; actor: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();

  const { data: claim } = await supabase
    .from("salon_claim_requests" as never)
    .select("id, created_new_salon, auth_user_id" as never)
    .eq("salon_id" as never, input.salonId)
    .eq("status" as never, "pending")
    .maybeSingle();

  if (!claim) {
    return { ok: false, error: "No pending claim request for this salon." };
  }

  const row = claim as unknown as {
    id: string;
    created_new_salon: boolean;
    auth_user_id: string;
  };

  const { error: claimError } = await supabase
    .from("salon_claim_requests" as never)
    .update({
      status: "rejected",
      reviewed_at: now,
      reviewed_by: input.actor,
      updated_at: now,
    } as never)
    .eq("id" as never, row.id);

  if (claimError) return { ok: false, error: claimError.message };

  if (row.auth_user_id) {
    await supabase.auth.admin.deleteUser(row.auth_user_id);
  }

  const salonUpdate: Record<string, unknown> = {
    ownership_status: row.created_new_salon ? "rejected" : "unclaimed",
    claimed: false,
    booking_enabled: false,
    updated_at: now,
  };
  if (row.created_new_salon) {
    salonUpdate.marketplace_visible = false;
  }

  await supabase.from("salons").update(salonUpdate).eq("id", input.salonId);

  return { ok: true };
}
