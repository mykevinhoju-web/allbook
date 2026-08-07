import type { OpeningHours } from "@/types/salon";
import type { MarketplaceCategorySlug } from "@/features/category";

/** Ops input for a Google discovery import run. */
export type GoogleImportTarget = {
  country: string;
  state: string;
  city: string;
  /** Marketplace category slug or label, e.g. hair | Hair */
  category: string;
};

export type GoogleImportOptions = {
  /** Max Text Search pages (each ~20 results). Default 5. */
  maxPages?: number;
  /** Page size 1–20. Default 20. */
  pageSize?: number;
  /** Max photos stored per business. Default 4. */
  maxPhotos?: number;
  /** Dry-run: call Google + map, skip DB writes. */
  dryRun?: boolean;
  /** Optional location bias radius in meters. Default 25000. */
  biasRadiusMeters?: number;
};

export type GooglePhotoRef = {
  name: string;
  widthPx?: number;
  heightPx?: number;
  /** Resolvable Places Photo media URL (API key appended at request time for fetch). */
  mediaUrl: string;
};

/** Normalized Google snapshot ready for salons upsert. */
export type GooglePlaceSnapshot = {
  placeId: string;
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
  openingHours: OpeningHours;
  photos: GooglePhotoRef[];
  googleCategories: string[];
  primaryType: string | null;
  categorySlug: MarketplaceCategorySlug;
  primaryService: string;
};

export type GoogleImportUpsertAction = "inserted" | "updated" | "skipped";

export type GoogleImportPlaceResult = {
  placeId: string;
  name: string;
  action: GoogleImportUpsertAction;
  salonId?: string;
  error?: string;
};

export type GoogleImportRunResult = {
  target: GoogleImportTarget;
  queried: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  places: GoogleImportPlaceResult[];
};
