import type { AmenityId, OpeningHours } from "@/types/salon";
import type { MarketplaceCategorySlug } from "@/features/category";

export type RegistrationMethod = "google" | "manual" | "admin";

export type RegistrationProfile = {
  businessName: string;
  categorySlug: MarketplaceCategorySlug | "";
  address: string;
  suburb: string;
  postcode: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  logo: string;
  coverImage: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
};

export type RegistrationBusinessDetails = {
  openingHours: OpeningHours;
  socialInstagram: string;
  socialFacebook: string;
  socialTikTok: string;
  languages: string[];
  amenities: AmenityId[];
};

export type RegistrationOwnerAccount = {
  ownerName: string;
  ownerEmail: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export type SalonRegistrationDraft = {
  method: RegistrationMethod | null;
  profile: RegistrationProfile;
  details: RegistrationBusinessDetails;
  owner: RegistrationOwnerAccount;
};

export type CreateSalonRegistrationInput = {
  method: Exclude<RegistrationMethod, "admin">;
  profile: RegistrationProfile;
  details: RegistrationBusinessDetails;
  owner: Omit<RegistrationOwnerAccount, "confirmPassword"> & {
    acceptedTerms: boolean;
  };
  /** When the registrant is already signed in */
  authUserId?: string;
};

export type CreateSalonRegistrationResult = {
  salonId: string;
  authUserId: string;
  slug: string;
  categorySlug: MarketplaceCategorySlug;
  publicPath: string;
  publicUrl: string;
  dashboardPath: `/register/claim/${string}` | "/register/pending" | "/platform/salon";
  ownershipStatus: "pending_verification" | "verified";
  reviewRequired: boolean;
  claimedExisting: boolean;
  /** True so claimant can complete business-control verification; dashboard still blocked */
  canLogin: boolean;
  claimRequestId?: string;
};
