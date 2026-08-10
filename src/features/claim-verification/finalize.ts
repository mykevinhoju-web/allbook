import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { recordClaimEvent } from "./audit";
import {
  decideOwnership,
  type ClaimVerificationMethod,
  type RiskFlag,
} from "./core";

type AnySupabase = SupabaseClient<Database>;

export type ClaimRow = {
  id: string;
  salon_id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  password_hash: string;
  status: string;
  verification_state: string;
  match_reasons: string[];
  match_confidence: number;
  risk_score: number;
  risk_flags: string[];
  failed_verification_attempts: number;
  created_new_salon: boolean;
  account_email_verified_at: string | null;
  business_verified_at: string | null;
};

async function loadClaim(
  supabase: AnySupabase,
  claimId: string,
): Promise<ClaimRow | null> {
  const { data } = await supabase
    .from("salon_claim_requests" as never)
    .select(
      "id, salon_id, auth_user_id, full_name, email, password_hash, status, verification_state, match_reasons, match_confidence, risk_score, risk_flags, failed_verification_attempts, created_new_salon, account_email_verified_at, business_verified_at" as never,
    )
    .eq("id" as never, claimId)
    .maybeSingle();
  return (data as ClaimRow | null) ?? null;
}

async function salonHasVerifiedOwner(
  supabase: AnySupabase,
  salonId: string,
): Promise<boolean> {
  const { data: salon } = await supabase
    .from("salons")
    .select("ownership_status, claimed, profile_authority")
    .eq("id", salonId)
    .maybeSingle();
  if (
    salon &&
    ((salon as { ownership_status?: string }).ownership_status === "verified" ||
      (salon as { profile_authority?: string }).profile_authority === "owner")
  ) {
    return true;
  }
  const { data: owner } = await supabase
    .from("salon_owners")
    .select("id")
    .eq("salon_id", salonId)
    .maybeSingle();
  return Boolean(owner?.id);
}

/**
 * After business-control proof succeeds, decide and optionally grant ownership
 * on the EXISTING salon.id (never create a duplicate).
 */
export async function evaluateAndFinalizeClaim(
  supabase: AnySupabase,
  input: {
    claimId: string;
    actor: string;
    emailVerified: boolean;
    businessControlVerified: boolean;
    method?: ClaimVerificationMethod;
  },
): Promise<
  | { ok: true; outcome: string; claim: ClaimRow }
  | { ok: false; error: string }
> {
  const claim = await loadClaim(supabase, input.claimId);
  if (!claim) return { ok: false, error: "Claim not found." };
  if (["approved", "verified", "rejected"].includes(claim.status)) {
    return { ok: false, error: `Claim is already ${claim.status}.` };
  }

  const hasVerifiedOwner = await salonHasVerifiedOwner(
    supabase,
    claim.salon_id,
  );

  const decision = decideOwnership({
    authenticated: true,
    emailVerified: input.emailVerified,
    matchConfidence: claim.match_confidence ?? 0,
    businessControlVerified: input.businessControlVerified,
    hasVerifiedOwner,
    riskScore: claim.risk_score ?? 0,
    riskFlags: (claim.risk_flags ?? []) as RiskFlag[],
    failedAttempts: claim.failed_verification_attempts ?? 0,
  });

  const now = new Date().toISOString();

  if (decision.outcome === "conflict") {
    await supabase
      .from("salon_claim_requests" as never)
      .update({
        status: "conflict",
        verification_state: "conflict",
        updated_at: now,
      } as never)
      .eq("id" as never, claim.id);
    await recordClaimEvent(supabase, {
      claimId: claim.id,
      salonId: claim.salon_id,
      authUserId: claim.auth_user_id,
      event: "conflict_detected",
      verificationMethod: input.method,
      result: "conflict",
      details: { reason: decision.reason },
    });
    return { ok: true, outcome: "conflict", claim };
  }

  if (decision.outcome === "manual_review") {
    await supabase
      .from("salon_claim_requests" as never)
      .update({
        status: "manual_review",
        verification_state: "manual_review",
        updated_at: now,
      } as never)
      .eq("id" as never, claim.id);
    await recordClaimEvent(supabase, {
      claimId: claim.id,
      salonId: claim.salon_id,
      authUserId: claim.auth_user_id,
      event: "manual_review_required",
      verificationMethod: input.method,
      result: "manual_review",
      details: { reason: decision.reason },
    });
    return { ok: true, outcome: "manual_review", claim };
  }

  if (decision.outcome !== "verified") {
    await supabase
      .from("salon_claim_requests" as never)
      .update({
        status: "business_verification_required",
        verification_state: decision.outcome,
        updated_at: now,
      } as never)
      .eq("id" as never, claim.id);
    return { ok: true, outcome: decision.outcome, claim };
  }

  // Grant ownership on existing salon — never replace an existing owner.
  if (hasVerifiedOwner) {
    return { ok: false, error: "Cannot replace an existing verified owner." };
  }

  const { data: existingOwner } = await supabase
    .from("salon_owners")
    .select("id")
    .eq("salon_id", claim.salon_id)
    .maybeSingle();
  if (existingOwner) {
    return { ok: false, error: "Salon already has an owner record." };
  }

  const { error: ownerError } = await supabase.from("salon_owners").insert({
    salon_id: claim.salon_id,
    full_name: claim.full_name,
    email: claim.email,
    password_hash: claim.password_hash,
    auth_user_id: claim.auth_user_id,
    role: "owner",
    accepted_terms_at: now,
  });
  if (ownerError) return { ok: false, error: ownerError.message };

  await supabase.auth.admin.updateUserById(claim.auth_user_id, {
    ban_duration: "none",
  });

  const { error: salonError } = await supabase
    .from("salons")
    .update({
      ownership_status: "verified",
      claimed: true,
      verified: true,
      profile_authority: "owner",
      review_status: "approved",
      reviewed_at: now,
      reviewed_by: input.actor,
      updated_at: now,
      ...(claim.created_new_salon ? { marketplace_visible: true } : {}),
    } as never)
    .eq("id", claim.salon_id);

  if (salonError) {
    await supabase.from("salon_owners").delete().eq("salon_id", claim.salon_id);
    return { ok: false, error: salonError.message };
  }

  await supabase
    .from("salon_claim_requests" as never)
    .update({
      status: "verified",
      verification_state: "verified",
      business_verified_at: claim.business_verified_at ?? now,
      ownership_verified_at: now,
      reviewed_at: now,
      reviewed_by: input.actor,
      last_verification_method: input.method ?? null,
      updated_at: now,
    } as never)
    .eq("id" as never, claim.id);

  await recordClaimEvent(supabase, {
    claimId: claim.id,
    salonId: claim.salon_id,
    authUserId: claim.auth_user_id,
    event: "ownership_verified",
    verificationMethod: input.method,
    result: "verified",
    details: { reason: decision.reason, actor: input.actor },
  });
  await recordClaimEvent(supabase, {
    claimId: claim.id,
    salonId: claim.salon_id,
    authUserId: claim.auth_user_id,
    event: "claim_approved",
    verificationMethod: input.method,
    result: "approved",
    details: { auto: true, actor: input.actor },
  });

  const refreshed = await loadClaim(supabase, claim.id);
  return { ok: true, outcome: "verified", claim: refreshed ?? claim };
}

export async function bumpFailedAttempt(
  supabase: AnySupabase,
  claimId: string,
): Promise<number> {
  const claim = await loadClaim(supabase, claimId);
  if (!claim) return 0;
  const next = (claim.failed_verification_attempts ?? 0) + 1;
  const patch: Record<string, unknown> = {
    failed_verification_attempts: next,
    updated_at: new Date().toISOString(),
  };
  if (next >= 5) {
    patch.status = "manual_review";
    patch.verification_state = "manual_review";
  }
  await supabase
    .from("salon_claim_requests" as never)
    .update(patch as never)
    .eq("id" as never, claimId);
  return next;
}
