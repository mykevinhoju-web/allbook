import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  availableVerificationMethods,
  maskPhone,
  maskWebsite,
} from "./core";
import { postalConfigured, smsConfigured } from "./challenges";

type AnySupabase = SupabaseClient<Database>;

export async function getClaimVerificationStatus(
  supabase: AnySupabase,
  input: { claimId: string; authUserId: string },
) {
  const { data: claim, error } = await supabase
    .from("salon_claim_requests" as never)
    .select(
      "id, salon_id, auth_user_id, status, verification_state, match_reasons, match_confidence, risk_score, risk_flags, failed_verification_attempts, postal_fallback_eligible, account_email_verified_at, business_verified_at, ownership_verified_at, claimant_phone, catalogue_phone_match, created_new_salon" as never,
    )
    .eq("id" as never, input.claimId)
    .maybeSingle();

  if (error || !claim) throw new Error("Claim not found.");
  const row = claim as {
    id: string;
    salon_id: string;
    auth_user_id: string;
    status: string;
    verification_state: string;
    match_reasons: string[];
    match_confidence: number;
    risk_score: number;
    risk_flags: string[];
    failed_verification_attempts: number;
    postal_fallback_eligible: boolean;
    account_email_verified_at: string | null;
    business_verified_at: string | null;
    ownership_verified_at: string | null;
    claimant_phone: string | null;
    catalogue_phone_match: boolean | null;
    created_new_salon: boolean;
  };

  if (row.auth_user_id !== input.authUserId) {
    throw new Error("Unauthorized.");
  }

  const { data: salon } = await supabase
    .from("salons")
    .select(
      "id, name, slug, suburb, city, website, phone, ownership_status, claimed, profile_authority, marketplace_visible",
    )
    .eq("id", row.salon_id)
    .maybeSingle();

  if (!salon) throw new Error("Salon not found.");

  const salonRow = salon as {
    id: string;
    name: string;
    suburb: string | null;
    city: string;
    website: string | null;
    phone: string | null;
    ownership_status: string;
    profile_authority?: string;
  };

  const hasOwnerConflict =
    row.status === "conflict" ||
    row.verification_state === "conflict" ||
    salonRow.ownership_status === "verified" ||
    salonRow.profile_authority === "owner";

  const { data: verifications } = await supabase
    .from("salon_claim_verifications" as never)
    .select(
      "id, verification_method, status, attempt_count, expires_at, verified_at, target_hint, created_at" as never,
    )
    .eq("claim_id" as never, row.id)
    .order("created_at" as never, { ascending: false });

  const rows = (verifications ?? []) as Array<{
    verification_method: string;
    status: string;
  }>;

  const websiteFailedOrUnavailable =
    !salonRow.website ||
    rows.some(
      (r) =>
        r.verification_method === "website" &&
        ["failed", "expired", "unavailable"].includes(r.status),
    );
  const phoneFailedOrUnavailable =
    rows.some(
      (r) =>
        ["business_phone", "google_business_phone", "sms"].includes(
          r.verification_method,
        ) && ["failed", "expired", "unavailable"].includes(r.status),
    ) || !smsConfigured();

  const methods = availableVerificationMethods({
    hasWebsite: Boolean(salonRow.website),
    hasCataloguePhone: Boolean(salonRow.phone),
    smsConfigured: smsConfigured(),
    postalConfigured: postalConfigured(),
    websiteFailedOrUnavailable,
    phoneFailedOrUnavailable,
    highRisk: row.risk_score >= 35 || row.postal_fallback_eligible,
    hasOwnerConflict,
  });

  return {
    claim: {
      id: row.id,
      status: row.status,
      verificationState: row.verification_state,
      matchReasons: row.match_reasons,
      matchConfidence: row.match_confidence,
      riskScore: row.risk_score,
      riskFlags: row.risk_flags,
      failedAttempts: row.failed_verification_attempts,
      emailVerifiedAt: row.account_email_verified_at,
      businessVerifiedAt: row.business_verified_at,
      ownershipVerifiedAt: row.ownership_verified_at,
      cataloguePhoneMatch: row.catalogue_phone_match,
      postalFallbackEligible:
        row.postal_fallback_eligible || methods.postalAvailable,
    },
    business: {
      id: salonRow.id,
      name: salonRow.name,
      suburb: salonRow.suburb,
      city: salonRow.city,
      websiteHost: maskWebsite(salonRow.website),
      phoneHint: maskPhone(salonRow.phone),
      hasWebsite: Boolean(salonRow.website),
      hasPhone: Boolean(salonRow.phone),
      ownershipStatus: salonRow.ownership_status,
      profileAuthority: salonRow.profile_authority ?? "catalogue",
    },
    methods: {
      primary: methods.primary,
      fallback: methods.fallback,
      showPostal: methods.postalAvailable,
      smsAvailable: methods.smsAvailable,
    },
    verifications: verifications ?? [],
    conflict: hasOwnerConflict,
  };
}
