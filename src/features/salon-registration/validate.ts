import type { RegistrationProfile, RegistrationOwnerAccount } from "./types";

export function validateProfile(
  profile: RegistrationProfile,
): string | null {
  if (!profile.businessName.trim()) return "Business name is required.";
  if (!profile.categorySlug) return "Please choose a category.";
  if (!profile.address.trim()) return "Address is required.";
  if (!profile.suburb.trim()) return "Suburb is required.";
  if (!profile.postcode.trim()) return "Postcode is required.";
  if (!profile.state.trim()) return "State is required.";
  if (!profile.country.trim()) return "Country is required.";
  return null;
}

export function validateOwner(
  owner: RegistrationOwnerAccount,
): string | null {
  if (!owner.ownerName.trim()) return "Owner name is required.";
  if (!owner.ownerEmail.trim() || !owner.ownerEmail.includes("@")) {
    return "A valid owner email is required.";
  }
  if (owner.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (owner.password !== owner.confirmPassword) {
    return "Passwords do not match.";
  }
  if (!owner.acceptedTerms) {
    return "Please accept the terms to continue.";
  }
  return null;
}
