import type { OpeningHours } from "@/types/salon";

/** Raw import shape — mapped into Supabase rows by `importSalons`. */
export type SalonImportRecord = {
  name: string;
  slug: string;
  categorySlug: string;
  suburbName: string;
  description: string;
  phone: string;
  email: string | null;
  website: string | null;
  address: string;
  latitude: number;
  longitude: number;
  coverImage: string;
  logo: string | null;
  rating: number;
  reviewCount: number;
  verified: boolean;
  primaryService: string;
  startingPrice: number;
  priceMin: number;
  priceMax: number;
  amenities: string[];
  serviceTags: string[];
  openingHours: OpeningHours;
  gallery?: Array<{ url: string; alt?: string; sortOrder?: number }>;
  services?: Array<{
    category: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    sortOrder?: number;
  }>;
  staff?: Array<{
    name: string;
    position: string;
    photoUrl?: string | null;
    yearsExperience: number;
    languages?: string[];
    specialties?: string[];
    sortOrder?: number;
  }>;
};

export type ImportSalonsResult = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};
