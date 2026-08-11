import type { Json } from "@/types/database";

export type PartnerType = "business_linked" | "independent";

export type PartnerStatus = "invited" | "pending" | "active" | "suspended";

export type PartnerPricingType = "fixed" | "hourly" | "from" | "quote";

export type PartnerAreaMode = "suburb" | "radius" | "postcodes";

export type MarketplacePartner = {
  id: string;
  salonId: string | null;
  authUserId: string;
  partnerType: PartnerType;
  status: PartnerStatus;
  displayName: string;
  bio: string | null;
  phone: string | null;
  email: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Public-safe partner card — never includes email/phone. */
export type PublicMarketplacePartner = {
  id: string;
  salonId: string | null;
  partnerType: PartnerType;
  status: "active";
  displayName: string;
  bio: string | null;
  verifiedAt: string | null;
};

export type PartnerService = {
  id: string;
  partnerId: string;
  categorySlug: string;
  name: string;
  description: string | null;
  pricingType: PartnerPricingType;
  priceCents: number | null;
  priceMaxCents: number | null;
  currency: string;
  durationMinutes: number | null;
  travelFeeCents: number | null;
  minNoticeMinutes: number | null;
  attributes: Json;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartnerServiceArea = {
  id: string;
  partnerId: string;
  serviceId: string | null;
  mode: PartnerAreaMode;
  suburbId: string | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  postcodes: string[] | null;
  createdAt: string;
};

export type PartnerAvailabilityRule = {
  id: string;
  partnerId: string;
  timezone: string;
  weeklyWindows: Json;
  blackouts: Json;
  capacityPerSlot: number;
  createdAt: string;
  updatedAt: string;
};

export type CreatePartnerInput = {
  partnerType: PartnerType;
  salonId?: string | null;
  displayName: string;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type UpdatePartnerProfileInput = {
  displayName?: string;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type PartnerServiceInput = {
  categorySlug: string;
  name: string;
  description?: string | null;
  pricingType: PartnerPricingType;
  priceCents?: number | null;
  priceMaxCents?: number | null;
  currency?: string;
  durationMinutes?: number | null;
  travelFeeCents?: number | null;
  minNoticeMinutes?: number | null;
  attributes?: Json;
  isActive?: boolean;
};

export type PartnerAreaInput = {
  serviceId?: string | null;
  mode: PartnerAreaMode;
  suburbId?: string | null;
  centerLat?: number | null;
  centerLng?: number | null;
  radiusKm?: number | null;
  postcodes?: string[] | null;
};

export type PartnerAvailabilityInput = {
  timezone?: string;
  weeklyWindows?: Json;
  blackouts?: Json;
  capacityPerSlot?: number;
};

export type AdminPartnerListItem = MarketplacePartner & {
  serviceCount: number;
  salonName: string | null;
};
