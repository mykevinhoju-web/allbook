export type ClaimVerificationState =
  | "pending"
  | "email_verified"
  | "business_verification_required"
  | "business_verified"
  | "verified"
  | "rejected"
  | "manual_review"
  | "conflict";

export type ClaimVerificationMethod =
  | "account_email"
  | "sms"
  | "business_phone"
  | "website"
  | "google_business_phone"
  | "postal_mail"
  | "manual_review";

export type ClaimAuditEvent =
  | "claim_created"
  | "business_matched"
  | "email_verified"
  | "verification_requested"
  | "verification_failed"
  | "verification_succeeded"
  | "risk_flagged"
  | "manual_review_required"
  | "conflict_detected"
  | "claim_approved"
  | "claim_rejected"
  | "ownership_verified";

export type RiskFlag =
  | "existing_verified_owner"
  | "multiple_claim_attempts"
  | "repeated_failed_verification"
  | "claimant_differs_from_catalogue"
  | "phone_mismatch"
  | "website_mismatch"
  | "multiple_accounts_claiming"
  | "rapid_repeated_claims"
  | "google_place_id_only"
  | "email_only";

export const WEBSITE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const PHONE_OTP_TTL_MS = 10 * 60 * 1000;
export const POSTAL_CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_VERIFICATION_ATTEMPTS = 5;
export const MANUAL_REVIEW_FAIL_THRESHOLD = 5;

export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function phonesLikelyMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const da = normalizePhoneDigits(a);
  const db = normalizePhoneDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const aTail = da.slice(-9);
  const bTail = db.slice(-9);
  return aTail.length >= 8 && aTail === bTail;
}

export function maskPhone(phone: string | null | undefined): string | null {
  const d = normalizePhoneDigits(phone);
  if (d.length < 4) return null;
  return `***${d.slice(-4)}`;
}

export function maskWebsite(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

export type MatchConfidenceInput = {
  reasons: string[];
  hard: boolean;
};

/** google_place_id alone is identity, not ownership — confidence only for matching. */
export function scoreMatchConfidence(input: MatchConfidenceInput): number {
  let score = 0;
  const reasons = new Set(input.reasons);
  if (reasons.has("google_place_id")) score += 40;
  if (reasons.has("same_phone")) score += 35;
  if (reasons.has("name_and_suburb")) score += 25;
  if (reasons.has("name_and_address")) score += 30;
  if (reasons.has("same_website")) score += 20;
  if (input.hard) score += 10;
  return Math.min(100, score);
}

export type RiskInput = {
  hasVerifiedOwner: boolean;
  priorClaimCount: number;
  failedAttempts: number;
  distinctClaimantCount: number;
  recentClaimCount24h: number;
  phoneMismatch: boolean;
  websiteMismatch: boolean;
  claimantDiffers: boolean;
  onlyGooglePlaceId: boolean;
  emailOnlyNoBusinessControl: boolean;
};

export function evaluateClaimRisk(input: RiskInput): {
  score: number;
  flags: RiskFlag[];
  level: "low" | "medium" | "high";
} {
  const flags: RiskFlag[] = [];
  let score = 0;

  if (input.hasVerifiedOwner) {
    flags.push("existing_verified_owner");
    score += 100;
  }
  if (input.priorClaimCount >= 2) {
    flags.push("multiple_claim_attempts");
    score += 25;
  }
  if (input.failedAttempts >= 3) {
    flags.push("repeated_failed_verification");
    score += 30;
  }
  if (input.distinctClaimantCount >= 2) {
    flags.push("multiple_accounts_claiming");
    score += 35;
  }
  if (input.recentClaimCount24h >= 3) {
    flags.push("rapid_repeated_claims");
    score += 40;
  }
  if (input.phoneMismatch) {
    flags.push("phone_mismatch");
    score += 15;
  }
  if (input.websiteMismatch) {
    flags.push("website_mismatch");
    score += 10;
  }
  if (input.claimantDiffers) {
    flags.push("claimant_differs_from_catalogue");
    score += 20;
  }
  if (input.onlyGooglePlaceId) {
    flags.push("google_place_id_only");
    score += 5;
  }
  if (input.emailOnlyNoBusinessControl) {
    flags.push("email_only");
    score += 5;
  }

  const level: "low" | "medium" | "high" =
    score >= 80 ? "high" : score >= 35 ? "medium" : "low";

  return { score, flags, level };
}

export type DecisionInput = {
  authenticated: boolean;
  emailVerified: boolean;
  matchConfidence: number;
  businessControlVerified: boolean;
  hasVerifiedOwner: boolean;
  riskScore: number;
  riskFlags: RiskFlag[];
  failedAttempts: number;
};

export type OwnershipDecision =
  | { outcome: "verified"; reason: string }
  | { outcome: "conflict"; reason: string }
  | { outcome: "manual_review"; reason: string }
  | { outcome: "business_verification_required"; reason: string }
  | { outcome: "pending"; reason: string }
  | { outcome: "rejected"; reason: string };

/**
 * Google Place ID / email alone never grant ownership.
 */
export function decideOwnership(input: DecisionInput): OwnershipDecision {
  if (input.hasVerifiedOwner) {
    return {
      outcome: "conflict",
      reason: "An existing verified owner is already linked to this business.",
    };
  }
  if (!input.authenticated) {
    return { outcome: "pending", reason: "Claimant must be authenticated." };
  }
  if (!input.emailVerified) {
    return {
      outcome: "pending",
      reason: "Claimant account email must be verified first.",
    };
  }
  if (input.failedAttempts >= MANUAL_REVIEW_FAIL_THRESHOLD) {
    return {
      outcome: "manual_review",
      reason: "Too many failed verification attempts.",
    };
  }
  if (input.riskFlags.includes("rapid_repeated_claims")) {
    return {
      outcome: "manual_review",
      reason: "Suspicious rapid claim activity.",
    };
  }
  if (!input.businessControlVerified) {
    return {
      outcome: "business_verification_required",
      reason:
        "Business-control verification is required. Email or Google Place ID alone is not enough.",
    };
  }
  if (input.matchConfidence < 40) {
    return {
      outcome: "manual_review",
      reason: "Business match confidence is too low for automatic verification.",
    };
  }
  if (input.riskScore >= 80) {
    return {
      outcome: "manual_review",
      reason: "Risk score requires manual review.",
    };
  }
  return {
    outcome: "verified",
    reason: "Account verified, business control proven, no owner conflict.",
  };
}

export type MethodAvailabilityInput = {
  hasWebsite: boolean;
  hasCataloguePhone: boolean;
  smsConfigured: boolean;
  postalConfigured: boolean;
  websiteFailedOrUnavailable: boolean;
  phoneFailedOrUnavailable: boolean;
  highRisk: boolean;
  hasOwnerConflict: boolean;
};

export function availableVerificationMethods(input: MethodAvailabilityInput): {
  primary: ClaimVerificationMethod[];
  fallback: ClaimVerificationMethod[];
  smsAvailable: boolean;
  postalAvailable: boolean;
} {
  const primary: ClaimVerificationMethod[] = [];
  if (input.hasWebsite) primary.push("website");
  // Phone method is offered for evidence + future SMS; delivery may be unavailable.
  primary.push("business_phone");
  if (input.hasCataloguePhone) primary.push("google_business_phone");

  const postalAvailable =
    (input.websiteFailedOrUnavailable && input.phoneFailedOrUnavailable) ||
    input.highRisk ||
    input.hasOwnerConflict;

  const fallback: ClaimVerificationMethod[] = [];
  if (postalAvailable) fallback.push("postal_mail");
  fallback.push("manual_review");

  return {
    primary,
    fallback,
    smsAvailable: input.smsConfigured,
    postalAvailable,
  };
}

/** Owner-authoritative profile fields Google sync must never overwrite. */
export const OWNER_PROTECTED_SALON_FIELDS = [
  "name",
  "address",
  "suburb",
  "city",
  "state",
  "postcode",
  "country",
  "latitude",
  "longitude",
  "phone",
  "website",
  "opening_hours",
  "description",
  "logo",
  "cover_image",
  "social_instagram",
  "social_facebook",
  "social_tiktok",
  "amenities",
  "owner_keywords",
] as const;

export type GoogleSyncAuthority = "catalogue" | "owner";

/**
 * Build the salon patch Google sync is allowed to apply.
 * Owner authority → metadata only.
 */
export function buildGoogleSyncSalonPatch(input: {
  authority: GoogleSyncAuthority;
  ownerNameOverride?: boolean;
  snapshot: {
    name: string;
    address: string | null;
    suburb: string | null;
    city: string;
    state: string;
    postcode: string | null;
    country: string;
    latitude: number;
    longitude: number;
    phone: string | null;
    website: string | null;
    rating: number;
    reviewCount: number;
    openingHours: Record<string, unknown>;
    googleCategories: string[];
    googlePhotos: unknown;
    businessStatus: string | null;
    permanentlyClosed: boolean;
    snapshotHash: string;
  };
  nowIso: string;
}): Record<string, unknown> {
  const meta = {
    rating: input.snapshot.rating,
    review_count: input.snapshot.reviewCount,
    google_categories: input.snapshot.googleCategories,
    google_photos: input.snapshot.googlePhotos,
    google_business_status: input.snapshot.businessStatus,
    permanently_closed: input.snapshot.permanentlyClosed,
    google_snapshot_hash: input.snapshot.snapshotHash,
    google_synced_at: input.nowIso,
    updated_at: input.nowIso,
  };

  if (input.authority === "owner") {
    return meta;
  }

  return {
    ...meta,
    address: input.snapshot.address,
    suburb: input.snapshot.suburb,
    city: input.snapshot.city,
    state: input.snapshot.state,
    postcode: input.snapshot.postcode,
    country: input.snapshot.country,
    latitude: input.snapshot.latitude,
    longitude: input.snapshot.longitude,
    phone: input.snapshot.phone,
    website: input.snapshot.website,
    opening_hours: input.snapshot.openingHours,
    ...(input.ownerNameOverride ? {} : { name: input.snapshot.name }),
  };
}

export function websiteChallengeInstructions(token: string): {
  metaTag: string;
  filePath: string;
  fileBody: string;
} {
  return {
    metaTag: `<meta name="allbook-verification" content="${token}" />`,
    filePath: "/.well-known/allbook-verification.txt",
    fileBody: token,
  };
}
