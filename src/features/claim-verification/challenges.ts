import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { recordClaimEvent } from "./audit";
import {
  generateNumericOtp,
  generateVerificationToken,
  hashVerificationToken,
  maskPhone,
  maskWebsite,
  MAX_VERIFICATION_ATTEMPTS,
  PHONE_OTP_TTL_MS,
  phonesLikelyMatch,
  POSTAL_CODE_TTL_MS,
  tokensEqual,
  WEBSITE_TOKEN_TTL_MS,
  websiteChallengeInstructions,
  type ClaimVerificationMethod,
} from "./core";
import { bumpFailedAttempt, evaluateAndFinalizeClaim } from "./finalize";

type AnySupabase = SupabaseClient<Database>;

type ClaimAuthRow = {
  id: string;
  salon_id: string;
  auth_user_id: string;
  status: string;
  verification_state: string;
  account_email_verified_at: string | null;
  postal_fallback_eligible: boolean;
  risk_score: number;
  claimant_phone: string | null;
};

type SalonContact = {
  id: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  suburb: string | null;
  city: string;
  state: string;
  postcode: string | null;
  country: string;
};

async function requireClaimOwner(
  supabase: AnySupabase,
  claimId: string,
  authUserId: string,
): Promise<ClaimAuthRow> {
  const { data, error } = await supabase
    .from("salon_claim_requests" as never)
    .select(
      "id, salon_id, auth_user_id, status, verification_state, account_email_verified_at, postal_fallback_eligible, risk_score, claimant_phone" as never,
    )
    .eq("id" as never, claimId)
    .maybeSingle();
  if (error || !data) throw new Error("Claim not found.");
  const row = data as ClaimAuthRow;
  if (row.auth_user_id !== authUserId) {
    throw new Error("Unauthorized.");
  }
  return row;
}

async function loadSalon(
  supabase: AnySupabase,
  salonId: string,
): Promise<SalonContact> {
  const { data, error } = await supabase
    .from("salons")
    .select(
      "id, website, phone, address, suburb, city, state, postcode, country",
    )
    .eq("id", salonId)
    .maybeSingle();
  if (error || !data) throw new Error("Salon not found.");
  return data as SalonContact;
}

function smsConfigured(): boolean {
  return Boolean(
    process.env.CLAIM_SMS_PROVIDER?.trim() ||
      process.env.TWILIO_ACCOUNT_SID?.trim(),
  );
}

function postalConfigured(): boolean {
  return Boolean(process.env.CLAIM_POSTAL_PROVIDER?.trim());
}

async function cancelActiveChallenges(
  supabase: AnySupabase,
  claimId: string,
  method: ClaimVerificationMethod,
) {
  await supabase
    .from("salon_claim_verifications" as never)
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("claim_id" as never, claimId)
    .eq("verification_method" as never, method)
    .in("status" as never, ["pending", "sent", "queued"]);
}

export async function startWebsiteVerification(
  supabase: AnySupabase,
  input: { claimId: string; authUserId: string },
) {
  const claim = await requireClaimOwner(
    supabase,
    input.claimId,
    input.authUserId,
  );
  if (!claim.account_email_verified_at) {
    throw new Error("Verify your AllBook account email before business verification.");
  }
  const salon = await loadSalon(supabase, claim.salon_id);
  if (!salon.website?.trim()) {
    throw new Error("This listing has no website on file for verification.");
  }

  const token = generateVerificationToken();
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + WEBSITE_TOKEN_TTL_MS).toISOString();
  const instructions = websiteChallengeInstructions(token);

  await cancelActiveChallenges(supabase, claim.id, "website");

  const { data, error } = await supabase
    .from("salon_claim_verifications" as never)
    .insert({
      claim_id: claim.id,
      salon_id: claim.salon_id,
      auth_user_id: claim.auth_user_id,
      verification_method: "website",
      status: "pending",
      token_hash: tokenHash,
      challenge_hint: "meta_or_well_known_file",
      target_hint: maskWebsite(salon.website),
      max_attempts: MAX_VERIFICATION_ATTEMPTS,
      expires_at: expiresAt,
      metadata: {
        host: maskWebsite(salon.website),
        // Token returned once to the claimant UI — not stored in metadata.
      },
    } as never)
    .select("id" as never)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not start website verification.");

  await recordClaimEvent(supabase, {
    claimId: claim.id,
    salonId: claim.salon_id,
    authUserId: claim.auth_user_id,
    event: "verification_requested",
    verificationMethod: "website",
    result: "pending",
    details: { verificationId: (data as { id: string }).id },
  });

  return {
    verificationId: (data as { id: string }).id,
    expiresAt,
    token,
    instructions,
    targetHost: maskWebsite(salon.website),
  };
}

async function fetchWebsiteProof(website: string, token: string): Promise<boolean> {
  const base = website.includes("://") ? website : `https://${website}`;
  let origin: string;
  try {
    origin = new URL(base).origin;
  } catch {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const fileUrl = `${origin}/.well-known/allbook-verification.txt`;
    const fileRes = await fetch(fileUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "AllBookClaimBot/1.0" },
    });
    if (fileRes.ok) {
      const body = (await fileRes.text()).trim();
      if (body.includes(token)) return true;
    }

    const homeRes = await fetch(origin, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "AllBookClaimBot/1.0" },
    });
    if (!homeRes.ok) return false;
    const html = await homeRes.text();
    if (html.includes(`content="${token}"`)) return true;
    if (html.includes(token) && /allbook-verification/i.test(html)) return true;
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function confirmWebsiteVerificationWithToken(
  supabase: AnySupabase,
  input: {
    claimId: string;
    authUserId: string;
    token: string;
    verificationId?: string;
  },
) {
  const claim = await requireClaimOwner(
    supabase,
    input.claimId,
    input.authUserId,
  );
  const salon = await loadSalon(supabase, claim.salon_id);

  const { data: row } = await supabase
    .from("salon_claim_verifications" as never)
    .select(
      "id, token_hash, status, attempt_count, max_attempts, expires_at, verified_at" as never,
    )
    .eq("claim_id" as never, claim.id)
    .eq("verification_method" as never, "website")
    .in("status" as never, ["pending", "sent"])
    .order("created_at" as never, { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) throw new Error("No active website verification challenge.");
  const challenge = row as {
    id: string;
    token_hash: string | null;
    attempt_count: number;
    max_attempts: number;
    expires_at: string | null;
    verified_at: string | null;
  };

  if (challenge.verified_at) throw new Error("Verification token already used.");
  if (challenge.expires_at && new Date(challenge.expires_at) < new Date()) {
    await supabase
      .from("salon_claim_verifications" as never)
      .update({ status: "expired", updated_at: new Date().toISOString() } as never)
      .eq("id" as never, challenge.id);
    throw new Error("Verification token expired.");
  }
  if (challenge.attempt_count >= challenge.max_attempts) {
    await bumpFailedAttempt(supabase, claim.id);
    throw new Error("Too many verification attempts.");
  }

  const nextAttempts = challenge.attempt_count + 1;
  await supabase
    .from("salon_claim_verifications" as never)
    .update({
      attempt_count: nextAttempts,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id" as never, challenge.id);

  if (!challenge.token_hash || !tokensEqual(challenge.token_hash, input.token)) {
    await bumpFailedAttempt(supabase, claim.id);
    await recordClaimEvent(supabase, {
      claimId: claim.id,
      salonId: claim.salon_id,
      authUserId: claim.auth_user_id,
      event: "verification_failed",
      verificationMethod: "website",
      result: "invalid_token",
    });
    throw new Error("Invalid verification token.");
  }

  const found = await fetchWebsiteProof(salon.website ?? "", input.token);
  if (!found) {
    await bumpFailedAttempt(supabase, claim.id);
    await recordClaimEvent(supabase, {
      claimId: claim.id,
      salonId: claim.salon_id,
      authUserId: claim.auth_user_id,
      event: "verification_failed",
      verificationMethod: "website",
      result: "token_not_found_on_website",
    });
    throw new Error(
      "Could not find the verification token on your website yet. Publish the meta tag or verification file, then try again.",
    );
  }

  const now = new Date().toISOString();
  await supabase
    .from("salon_claim_verifications" as never)
    .update({
      status: "verified",
      verified_at: now,
      token_hash: null,
      updated_at: now,
    } as never)
    .eq("id" as never, challenge.id);

  await supabase
    .from("salon_claim_requests" as never)
    .update({
      status: "business_verified",
      verification_state: "business_verified",
      business_verified_at: now,
      last_verification_method: "website",
      updated_at: now,
    } as never)
    .eq("id" as never, claim.id);

  await recordClaimEvent(supabase, {
    claimId: claim.id,
    salonId: claim.salon_id,
    authUserId: claim.auth_user_id,
    event: "verification_succeeded",
    verificationMethod: "website",
    result: "verified",
  });

  return evaluateAndFinalizeClaim(supabase, {
    claimId: claim.id,
    actor: `claimant:${claim.auth_user_id}`,
    emailVerified: Boolean(claim.account_email_verified_at),
    businessControlVerified: true,
    method: "website",
  });
}

export async function startPhoneVerification(
  supabase: AnySupabase,
  input: {
    claimId: string;
    authUserId: string;
    phone: string;
    preferGoogleListed?: boolean;
  },
) {
  const claim = await requireClaimOwner(
    supabase,
    input.claimId,
    input.authUserId,
  );
  if (!claim.account_email_verified_at) {
    throw new Error("Verify your AllBook account email before business verification.");
  }
  const salon = await loadSalon(supabase, claim.salon_id);
  const method: ClaimVerificationMethod = input.preferGoogleListed
    ? "google_business_phone"
    : "business_phone";

  const otp = generateNumericOtp(6);
  const tokenHash = hashVerificationToken(otp);
  const expiresAt = new Date(Date.now() + PHONE_OTP_TTL_MS).toISOString();

  await cancelActiveChallenges(supabase, claim.id, method);

  const { data, error } = await supabase
    .from("salon_claim_verifications" as never)
    .insert({
      claim_id: claim.id,
      salon_id: claim.salon_id,
      auth_user_id: claim.auth_user_id,
      verification_method: method,
      status: smsConfigured() ? "sent" : "unavailable",
      token_hash: tokenHash,
      challenge_hint: "otp",
      target_hint: maskPhone(input.phone),
      max_attempts: MAX_VERIFICATION_ATTEMPTS,
      expires_at: expiresAt,
      metadata: {
        cataloguePhoneMatch: phonesLikelyMatch(salon.phone, input.phone),
        delivery: smsConfigured() ? "sms" : "unavailable",
      },
    } as never)
    .select("id" as never)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not start phone verification.");
  }

  await supabase
    .from("salon_claim_requests" as never)
    .update({
      claimant_phone: input.phone.trim(),
      catalogue_phone_match: phonesLikelyMatch(salon.phone, input.phone),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id" as never, claim.id);

  await recordClaimEvent(supabase, {
    claimId: claim.id,
    salonId: claim.salon_id,
    authUserId: claim.auth_user_id,
    event: "verification_requested",
    verificationMethod: method,
    result: smsConfigured() ? "sent" : "unavailable",
    details: {
      verificationId: (data as { id: string }).id,
      smsConfigured: smsConfigured(),
    },
  });

  // Dev/test only — never return OTP in production responses.
  const exposeOtp =
    process.env.NODE_ENV !== "production" ||
    process.env.CLAIM_PHONE_OTP_MODE === "test";

  return {
    verificationId: (data as { id: string }).id,
    expiresAt,
    delivery: smsConfigured() ? ("sms" as const) : ("unavailable" as const),
    targetHint: maskPhone(input.phone),
    ...(exposeOtp ? { testOtp: otp } : {}),
    message: smsConfigured()
      ? "We sent a code to your business phone."
      : "SMS delivery is not configured. Enter the code from a test channel, use website verification, or request postal / manual review.",
  };
}

export async function confirmPhoneVerification(
  supabase: AnySupabase,
  input: {
    claimId: string;
    authUserId: string;
    otp: string;
    method?: "business_phone" | "google_business_phone";
  },
) {
  const claim = await requireClaimOwner(
    supabase,
    input.claimId,
    input.authUserId,
  );
  const method = input.method ?? "business_phone";

  const { data: row } = await supabase
    .from("salon_claim_verifications" as never)
    .select(
      "id, token_hash, status, attempt_count, max_attempts, expires_at, verified_at" as never,
    )
    .eq("claim_id" as never, claim.id)
    .eq("verification_method" as never, method)
    .in("status" as never, ["pending", "sent", "unavailable"])
    .order("created_at" as never, { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) throw new Error("No active phone verification challenge.");
  const challenge = row as {
    id: string;
    token_hash: string | null;
    attempt_count: number;
    max_attempts: number;
    expires_at: string | null;
    verified_at: string | null;
  };

  if (challenge.verified_at) throw new Error("Verification code already used.");
  if (challenge.expires_at && new Date(challenge.expires_at) < new Date()) {
    await supabase
      .from("salon_claim_verifications" as never)
      .update({ status: "expired", updated_at: new Date().toISOString() } as never)
      .eq("id" as never, challenge.id);
    throw new Error("Verification code expired.");
  }
  if (challenge.attempt_count >= challenge.max_attempts) {
    await bumpFailedAttempt(supabase, claim.id);
    throw new Error("Too many verification attempts.");
  }

  await supabase
    .from("salon_claim_verifications" as never)
    .update({
      attempt_count: challenge.attempt_count + 1,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id" as never, challenge.id);

  if (!challenge.token_hash || !tokensEqual(challenge.token_hash, input.otp.trim())) {
    const fails = await bumpFailedAttempt(supabase, claim.id);
    await recordClaimEvent(supabase, {
      claimId: claim.id,
      salonId: claim.salon_id,
      authUserId: claim.auth_user_id,
      event: "verification_failed",
      verificationMethod: method,
      result: "invalid_otp",
      details: { failedAttempts: fails },
    });
    throw new Error("Invalid verification code.");
  }

  const now = new Date().toISOString();
  await supabase
    .from("salon_claim_verifications" as never)
    .update({
      status: "verified",
      verified_at: now,
      token_hash: null,
      updated_at: now,
    } as never)
    .eq("id" as never, challenge.id);

  await supabase
    .from("salon_claim_requests" as never)
    .update({
      status: "business_verified",
      verification_state: "business_verified",
      business_verified_at: now,
      last_verification_method: method,
      updated_at: now,
    } as never)
    .eq("id" as never, claim.id);

  await recordClaimEvent(supabase, {
    claimId: claim.id,
    salonId: claim.salon_id,
    authUserId: claim.auth_user_id,
    event: "verification_succeeded",
    verificationMethod: method,
    result: "verified",
  });

  return evaluateAndFinalizeClaim(supabase, {
    claimId: claim.id,
    actor: `claimant:${claim.auth_user_id}`,
    emailVerified: Boolean(claim.account_email_verified_at),
    businessControlVerified: true,
    method,
  });
}

export async function requestPostalVerification(
  supabase: AnySupabase,
  input: { claimId: string; authUserId: string },
) {
  const claim = await requireClaimOwner(
    supabase,
    input.claimId,
    input.authUserId,
  );
  if (!claim.postal_fallback_eligible && claim.risk_score < 35) {
    // Re-check eligibility dynamically from failed methods
    const { data: fails } = await supabase
      .from("salon_claim_verifications" as never)
      .select("verification_method, status" as never)
      .eq("claim_id" as never, claim.id);

    const rows = (fails ?? []) as Array<{
      verification_method: string;
      status: string;
    }>;
    const websiteDone = rows.some(
      (r) =>
        r.verification_method === "website" &&
        ["failed", "expired", "unavailable"].includes(r.status),
    );
    const phoneDone = rows.some(
      (r) =>
        ["business_phone", "google_business_phone"].includes(
          r.verification_method,
        ) && ["failed", "expired", "unavailable"].includes(r.status),
    );
    const noWebsite = !(await loadSalon(supabase, claim.salon_id)).website;
    if (!(noWebsite || websiteDone) || !phoneDone) {
      if (claim.verification_state !== "conflict") {
        throw new Error(
          "Postal verification is only available when website and phone verification are unavailable or have failed, or when the claim is high-risk.",
        );
      }
    }
  }

  const salon = await loadSalon(supabase, claim.salon_id);
  const code = generateNumericOtp(8);
  const tokenHash = hashVerificationToken(code);
  const expiresAt = new Date(Date.now() + POSTAL_CODE_TTL_MS).toISOString();

  await cancelActiveChallenges(supabase, claim.id, "postal_mail");

  const { data, error } = await supabase
    .from("salon_claim_verifications" as never)
    .insert({
      claim_id: claim.id,
      salon_id: claim.salon_id,
      auth_user_id: claim.auth_user_id,
      verification_method: "postal_mail",
      status: postalConfigured() ? "queued" : "queued",
      token_hash: tokenHash,
      challenge_hint: "postal_code",
      target_hint: [salon.suburb, salon.city, salon.state]
        .filter(Boolean)
        .join(", "),
      max_attempts: 5,
      expires_at: expiresAt,
      metadata: {
        delivery: postalConfigured() ? "provider" : "manual_ops_queue",
        addressPresent: Boolean(salon.address),
      },
    } as never)
    .select("id" as never)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not request postal verification.");
  }

  await supabase
    .from("salon_claim_requests" as never)
    .update({
      postal_fallback_eligible: true,
      status: "manual_review",
      verification_state: "manual_review",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id" as never, claim.id);

  await recordClaimEvent(supabase, {
    claimId: claim.id,
    salonId: claim.salon_id,
    authUserId: claim.auth_user_id,
    event: "verification_requested",
    verificationMethod: "postal_mail",
    result: "queued",
    details: {
      verificationId: (data as { id: string }).id,
      postalConfigured: postalConfigured(),
      // Do not log full street address — suburb/city only.
      destination: [salon.suburb, salon.city, salon.state, salon.postcode]
        .filter(Boolean)
        .join(", "),
    },
  });

  const expose =
    process.env.NODE_ENV !== "production" ||
    process.env.CLAIM_POSTAL_CODE_MODE === "test";

  return {
    verificationId: (data as { id: string }).id,
    expiresAt,
    delivery: postalConfigured() ? "provider" : "manual_ops_queue",
    message: postalConfigured()
      ? "A verification letter will be sent to the business address."
      : "Postal verification was queued for AllBook operations. No paid postal provider is configured yet.",
    ...(expose ? { testCode: code } : {}),
  };
}

export async function confirmPostalVerification(
  supabase: AnySupabase,
  input: { claimId: string; authUserId: string; code: string },
) {
  const claim = await requireClaimOwner(
    supabase,
    input.claimId,
    input.authUserId,
  );

  const { data: row } = await supabase
    .from("salon_claim_verifications" as never)
    .select(
      "id, token_hash, attempt_count, max_attempts, expires_at, verified_at" as never,
    )
    .eq("claim_id" as never, claim.id)
    .eq("verification_method" as never, "postal_mail")
    .in("status" as never, ["pending", "sent", "queued"])
    .order("created_at" as never, { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) throw new Error("No active postal verification.");
  const challenge = row as {
    id: string;
    token_hash: string | null;
    attempt_count: number;
    max_attempts: number;
    expires_at: string | null;
    verified_at: string | null;
  };

  if (challenge.verified_at) throw new Error("Postal code already used.");
  if (challenge.expires_at && new Date(challenge.expires_at) < new Date()) {
    await supabase
      .from("salon_claim_verifications" as never)
      .update({ status: "expired", updated_at: new Date().toISOString() } as never)
      .eq("id" as never, challenge.id);
    throw new Error("Postal verification code expired.");
  }
  if (challenge.attempt_count >= challenge.max_attempts) {
    await bumpFailedAttempt(supabase, claim.id);
    throw new Error("Too many verification attempts.");
  }

  await supabase
    .from("salon_claim_verifications" as never)
    .update({
      attempt_count: challenge.attempt_count + 1,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id" as never, challenge.id);

  if (!challenge.token_hash || !tokensEqual(challenge.token_hash, input.code.trim())) {
    await bumpFailedAttempt(supabase, claim.id);
    await recordClaimEvent(supabase, {
      claimId: claim.id,
      salonId: claim.salon_id,
      authUserId: claim.auth_user_id,
      event: "verification_failed",
      verificationMethod: "postal_mail",
      result: "invalid_code",
    });
    throw new Error("Invalid postal verification code.");
  }

  const now = new Date().toISOString();
  await supabase
    .from("salon_claim_verifications" as never)
    .update({
      status: "verified",
      verified_at: now,
      token_hash: null,
      updated_at: now,
    } as never)
    .eq("id" as never, challenge.id);

  await supabase
    .from("salon_claim_requests" as never)
    .update({
      status: "business_verified",
      verification_state: "business_verified",
      business_verified_at: now,
      last_verification_method: "postal_mail",
      updated_at: now,
    } as never)
    .eq("id" as never, claim.id);

  await recordClaimEvent(supabase, {
    claimId: claim.id,
    salonId: claim.salon_id,
    authUserId: claim.auth_user_id,
    event: "verification_succeeded",
    verificationMethod: "postal_mail",
    result: "verified",
  });

  return evaluateAndFinalizeClaim(supabase, {
    claimId: claim.id,
    actor: `claimant:${claim.auth_user_id}`,
    emailVerified: Boolean(claim.account_email_verified_at),
    businessControlVerified: true,
    method: "postal_mail",
  });
}

export { smsConfigured, postalConfigured };
