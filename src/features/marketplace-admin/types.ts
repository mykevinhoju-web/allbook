export type BusinessManageStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "duplicate"
  | "hidden";

export type ManagedBusiness = {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string;
  state: string;
  phone: string | null;
  primaryService: string | null;
  rating: number;
  reviewCount: number;
  source: string;
  claimed: boolean;
  verified: boolean;
  reviewStatus: BusinessManageStatus;
  marketplaceVisible: boolean;
  bookingEnabled: boolean;
  permanentlyClosed: boolean;
  googlePlaceId: string | null;
  importedAt: string | null;
  googleSyncedAt: string | null;
  updatedAt: string;
  coverImage: string | null;
};

export type ListBusinessesInput = {
  q?: string;
  reviewStatus?: BusinessManageStatus | "all";
  booking?: "all" | "on" | "off";
  visible?: "all" | "yes" | "no";
  source?: string;
  includeSynthetic?: boolean;
  page?: number;
  pageSize?: number;
};

export type ListBusinessesResult = {
  items: ManagedBusiness[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type PatchBusinessInput = {
  bookingEnabled?: boolean;
  marketplaceVisible?: boolean;
  reviewStatus?: BusinessManageStatus;
  verified?: boolean;
};
