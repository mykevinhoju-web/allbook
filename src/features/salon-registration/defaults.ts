import type { OpeningHours } from "@/types/salon";

import type {
  RegistrationBusinessDetails,
  RegistrationOwnerAccount,
  RegistrationProfile,
  SalonRegistrationDraft,
} from "./types";

export function defaultOpeningHours(): OpeningHours {
  return {
    mon: { open: "09:00", close: "18:00", closed: false },
    tue: { open: "09:00", close: "18:00", closed: false },
    wed: { open: "09:00", close: "18:00", closed: false },
    thu: { open: "09:00", close: "20:00", closed: false },
    fri: { open: "09:00", close: "18:00", closed: false },
    sat: { open: "09:00", close: "17:00", closed: false },
    sun: { open: "10:00", close: "16:00", closed: true },
  };
}

export function emptyRegistrationProfile(): RegistrationProfile {
  return {
    businessName: "",
    categorySlug: "",
    address: "",
    suburb: "",
    postcode: "",
    state: "QLD",
    country: "Australia",
    phone: "",
    email: "",
    website: "",
    description: "",
    logo: "",
    coverImage: "",
    latitude: null,
    longitude: null,
    googlePlaceId: null,
  };
}

export function emptyBusinessDetails(): RegistrationBusinessDetails {
  return {
    openingHours: defaultOpeningHours(),
    socialInstagram: "",
    socialFacebook: "",
    socialTikTok: "",
    languages: ["English"],
    amenities: [],
  };
}

export function emptyOwnerAccount(): RegistrationOwnerAccount {
  return {
    ownerName: "",
    ownerEmail: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  };
}

export function createEmptyRegistrationDraft(): SalonRegistrationDraft {
  return {
    method: null,
    profile: emptyRegistrationProfile(),
    details: emptyBusinessDetails(),
    owner: emptyOwnerAccount(),
  };
}

export const REGISTRATION_LANGUAGE_OPTIONS = [
  "English",
  "Mandarin",
  "Cantonese",
  "Korean",
  "Vietnamese",
  "Japanese",
  "Hindi",
  "Spanish",
  "French",
] as const;

export const FALLBACK_COVER_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80";
