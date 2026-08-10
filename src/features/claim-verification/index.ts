/** Client-safe claim verification helpers (no Node crypto). */
export {
  availableVerificationMethods,
  buildGoogleSyncSalonPatch,
  decideOwnership,
  evaluateClaimRisk,
  OWNER_PROTECTED_SALON_FIELDS,
  phonesLikelyMatch,
  scoreMatchConfidence,
  websiteChallengeInstructions,
  type ClaimAuditEvent,
  type ClaimVerificationMethod,
  type ClaimVerificationState,
  type OwnershipDecision,
  type RiskFlag,
} from "./core";
