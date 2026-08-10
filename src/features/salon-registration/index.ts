export { createEmptyRegistrationDraft, defaultOpeningHours } from "./defaults";
export { createSalonRegistration } from "./create-salon-registration";
export {
  findCatalogueMatches,
  hardCatalogueMatches,
} from "./catalogue-match";
export type {
  CatalogueMatch,
  CatalogueMatchInput,
  CatalogueMatchReason,
} from "./catalogue-match";
export { slugifySalonName, ensureUniqueSalonSlug } from "./slug";
export { validateOwner, validateProfile } from "./validate";
export { SalonRegistrationWizard } from "./salon-registration-wizard";
export type {
  CreateSalonRegistrationInput,
  CreateSalonRegistrationResult,
  RegistrationBusinessDetails,
  RegistrationMethod,
  RegistrationOwnerAccount,
  RegistrationProfile,
  SalonRegistrationDraft,
} from "./types";
