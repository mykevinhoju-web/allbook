export { recordClaimEvent } from "./audit";
export {
  startWebsiteVerification,
  confirmWebsiteVerificationWithToken,
  startPhoneVerification,
  confirmPhoneVerification,
  requestPostalVerification,
  confirmPostalVerification,
  smsConfigured,
  postalConfigured,
} from "./challenges";
export {
  hashVerificationToken,
  generateVerificationToken,
  generateNumericOtp,
  tokensEqual,
  phonesLikelyMatch,
  scoreMatchConfidence,
  evaluateClaimRisk,
  decideOwnership,
  availableVerificationMethods,
  buildGoogleSyncSalonPatch,
  OWNER_PROTECTED_SALON_FIELDS,
  websiteChallengeInstructions,
  type ClaimVerificationState,
  type ClaimVerificationMethod,
  type ClaimAuditEvent,
  type RiskFlag,
  type OwnershipDecision,
} from "./core";
export { evaluateAndFinalizeClaim, bumpFailedAttempt } from "./finalize";
export { getClaimVerificationStatus } from "./status";
