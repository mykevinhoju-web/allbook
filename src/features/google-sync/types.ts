/** Sync job scope — does not change marketplace search architecture. */
export type GoogleSyncScope = "single" | "city" | "state" | "scheduled";

export type GoogleSyncItemResult =
  | "updated"
  | "unchanged"
  | "failed"
  | "closed"
  | "missing";

export type GoogleSyncTotals = {
  updated: number;
  unchanged: number;
  failed: number;
  closed: number;
  missing: number;
  processed: number;
  queued: number;
};

export const EMPTY_SYNC_TOTALS: GoogleSyncTotals = {
  updated: 0,
  unchanged: 0,
  failed: 0,
  closed: 0,
  missing: 0,
  processed: 0,
  queued: 0,
};

export type GoogleSyncTarget = {
  scope: GoogleSyncScope;
  country?: string;
  state?: string;
  city?: string;
  salonId?: string;
};

export type GoogleSyncSalonRow = {
  id: string;
  name: string;
  google_place_id: string;
  owner_name_override: boolean;
  google_snapshot_hash: string | null;
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
  review_count: number;
  opening_hours: Record<string, unknown> | null;
  google_categories: string[] | null;
  google_photos: unknown;
  google_business_status: string | null;
  permanently_closed: boolean;
};

/** Google-managed snapshot used for hash + patch (never owner catalog fields). */
export type GoogleManagedSnapshot = {
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
  openingHours: Record<string, unknown>;
  googleCategories: string[];
  photos: Array<{
    name: string;
    widthPx?: number | null;
    heightPx?: number | null;
  }>;
  businessStatus: string | null;
  permanentlyClosed: boolean;
};

export type GoogleSyncSalonResult = {
  salonId: string;
  placeId: string;
  businessName: string;
  result: GoogleSyncItemResult;
  changedFields: string[];
  error?: string;
};

export type GoogleSyncRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export type GoogleSyncRunSummary = {
  id: string;
  scope: GoogleSyncScope;
  country: string | null;
  state: string | null;
  city: string | null;
  salonId: string | null;
  status: GoogleSyncRunStatus;
  triggeredBy: string | null;
  totals: GoogleSyncTotals;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type GoogleSyncProgressEvent = {
  runId: string;
  processed: number;
  queued: number;
  totals: GoogleSyncTotals;
  label: string;
  done: boolean;
};
