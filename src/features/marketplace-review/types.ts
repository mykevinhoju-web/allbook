export type ReviewQueueTab =
  | "newly_imported"
  | "updated"
  | "duplicates"
  | "closed"
  | "missing"
  | "import_errors";

export type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "duplicate"
  | "hidden";

export type ReviewAction =
  | "approve"
  | "reject"
  | "hide"
  | "restore"
  | "mark_duplicate"
  | "permanently_closed"
  | "re_sync"
  | "merge";

export type BusinessEventAction =
  | "imported"
  | "updated"
  | "merged"
  | "rejected"
  | "hidden"
  | "claimed"
  | "synced"
  | "approved"
  | "restored"
  | "marked_duplicate"
  | "permanently_closed"
  | "re_synced"
  | "import_error";

export type DuplicateMatchReason =
  | "google_place_id"
  | "similar_name"
  | "same_phone"
  | "same_coordinates"
  | "same_website";

export type ReviewQueueItem = {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  source: string;
  claimed: boolean;
  reviewStatus: ReviewStatus;
  marketplaceVisible: boolean;
  permanentlyClosed: boolean;
  googlePlaceId: string | null;
  googleBusinessStatus: string | null;
  importedAt: string | null;
  googleSyncedAt: string | null;
  reviewedAt: string | null;
  duplicateOfSalonId: string | null;
  coverImage: string | null;
};

export type DuplicateSuggestion = {
  salon: ReviewQueueItem;
  reasons: DuplicateMatchReason[];
  score: number;
};

export type FieldDifference = {
  field: string;
  google: string | null;
  allbook: string | null;
};

export type BusinessReviewDetail = {
  salon: ReviewQueueItem & {
    description: string | null;
    address: string | null;
    postcode: string | null;
    country: string;
    latitude: number;
    longitude: number;
    email: string | null;
    logo: string | null;
    verified: boolean;
    amenities: string[];
    serviceTags: string[];
    googleCategories: string[];
    googlePhotos: unknown;
    openingHours: Record<string, unknown> | null;
    ownerNameOverride: boolean;
    categoryId: string | null;
    primaryService: string | null;
    bookingEnabled: boolean;
  };
  googleSnapshot: {
    placeId: string | null;
    name: string;
    address: string | null;
    phone: string | null;
    website: string | null;
    rating: number;
    reviewCount: number;
    categories: string[];
    businessStatus: string | null;
    photos: unknown;
    openingHours: Record<string, unknown> | null;
    latitude: number;
    longitude: number;
    syncedAt: string | null;
  };
  allbookData: {
    description: string | null;
    coverImage: string | null;
    logo: string | null;
    amenities: string[];
    serviceTags: string[];
    categoryId: string | null;
    primaryService: string | null;
    bookingEnabled: boolean;
    verified: boolean;
  };
  differences: FieldDifference[];
  claimStatus: {
    claimed: boolean;
    owner: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    } | null;
  };
  history: BusinessEventRow[];
  duplicates: DuplicateSuggestion[];
};

export type BusinessEventRow = {
  id: string;
  salonId: string | null;
  relatedSalonId: string | null;
  placeId: string | null;
  action: BusinessEventAction;
  actor: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type ImportErrorRow = {
  id: string;
  runId: string;
  salonId: string | null;
  placeId: string | null;
  businessName: string | null;
  error: string | null;
  createdAt: string;
};

export type QueueCounts = Record<ReviewQueueTab, number>;
