import type { OpeningHours } from "@/types/salon";
import type { MarketplaceCategorySlug } from "@/features/category";

/** Geographic breadth of an import job — supports suburb → nation without redesign. */
export type GoogleImportGeoScope =
  | "suburb"
  | "city"
  | "state"
  | "country";

/** Ops / admin input for a Google discovery import run. */
export type GoogleImportTarget = {
  country: string;
  /** Required for suburb | city | state scopes */
  state?: string;
  /** City or suburb locality name */
  city?: string;
  /** Optional finer locality when scope = suburb */
  suburb?: string;
  /** Marketplace category slug or label, e.g. hair | Hair */
  category: string;
  /** Default city when omitted for backward compatibility */
  scope?: GoogleImportGeoScope;
};

export type GoogleImportOptions = {
  /** Max Text Search pages per geo cell (each ~20 results). */
  maxPages?: number;
  /** Page size 1–20. Default 20. */
  pageSize?: number;
  /** Max photos stored per business. Default 4. */
  maxPhotos?: number;
  /** Dry-run: call Google + map, skip DB writes. */
  dryRun?: boolean;
  /** Override bias radius in meters. */
  biasRadiusMeters?: number;
};

export type GooglePhotoRef = {
  name: string;
  widthPx?: number;
  heightPx?: number;
  /** Public proxy path — never embeds API keys. */
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
  /** Places businessStatus e.g. OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY */
  businessStatus: string | null;
};

export type GoogleImportUpsertAction =
  | "inserted"
  | "updated"
  | "skipped"
  | "failed";

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
  failed: number;
  errors: string[];
  places: GoogleImportPlaceResult[];
  cellsProcessed: number;
};

/** Admin preview row (no DB write). */
export type GoogleImportPreviewItem = {
  placeId: string;
  name: string;
  address: string | null;
  suburb: string | null;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  phone: string | null;
  website: string | null;
  primaryType: string | null;
  googleCategories: string[];
  alreadyImported: boolean;
  claimed: boolean;
  photoUrl: string | null;
};

export type GoogleImportPreviewResult = {
  target: GoogleImportTarget;
  items: GoogleImportPreviewItem[];
  cellsProcessed: number;
  queried: number;
};

export type GoogleImportProgressEvent = {
  phase: "preview" | "import";
  current: number;
  total: number;
  label: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
};
