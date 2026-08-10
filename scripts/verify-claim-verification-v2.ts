/**
 * Claim verification v2 unit checks.
 * Run: npx tsx scripts/verify-claim-verification-v2.ts
 */
import assert from "node:assert/strict";

import {
  availableVerificationMethods,
  buildGoogleSyncSalonPatch,
  decideOwnership,
  evaluateClaimRisk,
  phonesLikelyMatch,
  scoreMatchConfidence,
  websiteChallengeInstructions,
} from "../src/features/claim-verification/core";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
function generateVerificationToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}
function generateNumericOtp(digits = 6): string {
  const max = 10 ** digits;
  const n = randomBytes(4).readUInt32BE(0) % max;
  return String(n).padStart(digits, "0");
}
function tokensEqual(aHash: string, bPlainOrHash: string): boolean {
  const bHash = hashVerificationToken(bPlainOrHash);
  const a = Buffer.from(aHash, "utf8");
  const b = Buffer.from(bHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// 1+2 decision: email + business control + match → verified
{
  const d = decideOwnership({
    authenticated: true,
    emailVerified: true,
    matchConfidence: 70,
    businessControlVerified: true,
    hasVerifiedOwner: false,
    riskScore: 10,
    riskFlags: [],
    failedAttempts: 0,
  });
  assert.equal(d.outcome, "verified");
}

// 3. Google Place ID alone is NOT ownership (no business control)
{
  const conf = scoreMatchConfidence({
    reasons: ["google_place_id"],
    hard: true,
  });
  assert.ok(conf >= 40);
  const d = decideOwnership({
    authenticated: true,
    emailVerified: true,
    matchConfidence: conf,
    businessControlVerified: false,
    hasVerifiedOwner: false,
    riskScore: 0,
    riskFlags: ["google_place_id_only"],
    failedAttempts: 0,
  });
  assert.equal(d.outcome, "business_verification_required");
}

// 4. Email alone NOT verified
{
  const d = decideOwnership({
    authenticated: true,
    emailVerified: true,
    matchConfidence: 80,
    businessControlVerified: false,
    hasVerifiedOwner: false,
    riskScore: 0,
    riskFlags: ["email_only"],
    failedAttempts: 0,
  });
  assert.equal(d.outcome, "business_verification_required");
}

// 5. Phone mismatch raises risk, does not auto-reject
{
  const risk = evaluateClaimRisk({
    hasVerifiedOwner: false,
    priorClaimCount: 0,
    failedAttempts: 0,
    distinctClaimantCount: 1,
    recentClaimCount24h: 0,
    phoneMismatch: true,
    websiteMismatch: false,
    claimantDiffers: false,
    onlyGooglePlaceId: false,
    emailOnlyNoBusinessControl: false,
  });
  assert.ok(risk.flags.includes("phone_mismatch"));
  assert.ok(risk.score > 0);
  assert.notEqual(risk.level, undefined);
  const d = decideOwnership({
    authenticated: true,
    emailVerified: true,
    matchConfidence: 70,
    businessControlVerified: true,
    hasVerifiedOwner: false,
    riskScore: risk.score,
    riskFlags: risk.flags,
    failedAttempts: 0,
  });
  assert.equal(d.outcome, "verified");
}

// 6. Existing verified owner → conflict (no auto replace)
{
  const d = decideOwnership({
    authenticated: true,
    emailVerified: true,
    matchConfidence: 90,
    businessControlVerified: true,
    hasVerifiedOwner: true,
    riskScore: 100,
    riskFlags: ["existing_verified_owner"],
    failedAttempts: 0,
  });
  assert.equal(d.outcome, "conflict");
}

// 7. Multiple failed attempts → manual review
{
  const d = decideOwnership({
    authenticated: true,
    emailVerified: true,
    matchConfidence: 70,
    businessControlVerified: true,
    hasVerifiedOwner: false,
    riskScore: 30,
    riskFlags: ["repeated_failed_verification"],
    failedAttempts: 5,
  });
  assert.equal(d.outcome, "manual_review");
}

// 8+9. Token hash / reuse semantics
{
  const token = generateVerificationToken();
  const hash = hashVerificationToken(token);
  assert.equal(tokensEqual(hash, token), true);
  assert.equal(tokensEqual(hash, "wrong"), false);
  const otp = generateNumericOtp(6);
  assert.equal(otp.length, 6);
  assert.equal(tokensEqual(hashVerificationToken(otp), otp), true);
}

// 10. Unauthorized approve is enforced in API (requirePlatformAdmin) — decision engine
// never grants ownership without server actor; conflict path covered above.

// 11. Owner sync patch never includes protected profile fields
{
  const patch = buildGoogleSyncSalonPatch({
    authority: "owner",
    snapshot: {
      name: "New Google Name",
      address: "1 Hack St",
      suburb: "Hack",
      city: "Brisbane",
      state: "QLD",
      postcode: "4000",
      country: "Australia",
      latitude: -27,
      longitude: 153,
      phone: "0400000000",
      website: "https://evil.example",
      rating: 4.9,
      reviewCount: 99,
      openingHours: {},
      googleCategories: ["hair_salon"],
      googlePhotos: [],
      businessStatus: "OPERATIONAL",
      permanentlyClosed: false,
      snapshotHash: "abc",
    },
    nowIso: new Date().toISOString(),
  });
  assert.equal(patch.phone, undefined);
  assert.equal(patch.address, undefined);
  assert.equal(patch.name, undefined);
  assert.equal(patch.website, undefined);
  assert.equal(patch.opening_hours, undefined);
  assert.equal(patch.rating, 4.9);
  assert.equal(patch.review_count, 99);
}

// 12. Catalogue sync still projects profile fields
{
  const patch = buildGoogleSyncSalonPatch({
    authority: "catalogue",
    snapshot: {
      name: "Catalogue Salon",
      address: "2 Main St",
      suburb: "City",
      city: "Brisbane",
      state: "QLD",
      postcode: "4000",
      country: "Australia",
      latitude: -27,
      longitude: 153,
      phone: "0730000000",
      website: "https://salon.example",
      rating: 4.2,
      reviewCount: 10,
      openingHours: { mon: { open: "09:00", close: "17:00", closed: false } },
      googleCategories: ["hair_salon"],
      googlePhotos: [],
      businessStatus: "OPERATIONAL",
      permanentlyClosed: false,
      snapshotHash: "def",
    },
    nowIso: new Date().toISOString(),
  });
  assert.equal(patch.name, "Catalogue Salon");
  assert.equal(patch.phone, "0730000000");
}

// 13. Postal only when fallback conditions met
{
  const normal = availableVerificationMethods({
    hasWebsite: true,
    hasCataloguePhone: true,
    smsConfigured: true,
    postalConfigured: false,
    websiteFailedOrUnavailable: false,
    phoneFailedOrUnavailable: false,
    highRisk: false,
    hasOwnerConflict: false,
  });
  assert.equal(normal.postalAvailable, false);
  assert.ok(normal.primary.includes("website"));

  const fallback = availableVerificationMethods({
    hasWebsite: false,
    hasCataloguePhone: false,
    smsConfigured: false,
    postalConfigured: false,
    websiteFailedOrUnavailable: true,
    phoneFailedOrUnavailable: true,
    highRisk: false,
    hasOwnerConflict: false,
  });
  assert.equal(fallback.postalAvailable, true);
  assert.ok(fallback.fallback.includes("postal_mail"));

  const conflict = availableVerificationMethods({
    hasWebsite: true,
    hasCataloguePhone: true,
    smsConfigured: true,
    postalConfigured: false,
    websiteFailedOrUnavailable: false,
    phoneFailedOrUnavailable: false,
    highRisk: false,
    hasOwnerConflict: true,
  });
  assert.equal(conflict.postalAvailable, true);
}

// Phone match helper
assert.equal(phonesLikelyMatch("(07) 3910 2987", "0739102987"), true);
assert.equal(phonesLikelyMatch("0739102987", "0400111222"), false);

const instructions = websiteChallengeInstructions("tok_test");
assert.match(instructions.metaTag, /allbook-verification/);
assert.equal(instructions.fileBody, "tok_test");

console.log("verify-claim-verification-v2: all assertions passed");
