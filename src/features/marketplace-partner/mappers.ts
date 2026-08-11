import type { Database, Json } from "@/types/database";
import type {
  MarketplacePartner,
  PartnerAvailabilityRule,
  PartnerService,
  PartnerServiceArea,
  PublicMarketplacePartner,
} from "./types";

type PartnerRow = Database["public"]["Tables"]["marketplace_partners"]["Row"];
type ServiceRow = Database["public"]["Tables"]["partner_services"]["Row"];
type AreaRow = Database["public"]["Tables"]["partner_service_areas"]["Row"];
type AvailabilityRow =
  Database["public"]["Tables"]["partner_availability_rules"]["Row"];

export function mapPartner(row: PartnerRow): MarketplacePartner {
  return {
    id: row.id,
    salonId: row.salon_id,
    authUserId: row.auth_user_id,
    partnerType: row.partner_type,
    status: row.status,
    displayName: row.display_name,
    bio: row.bio,
    phone: row.phone,
    email: row.email,
    verifiedAt: row.verified_at,
    isDemo: row.is_demo === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Strip PII for any public response. */
export function toPublicPartner(
  partner: MarketplacePartner,
): PublicMarketplacePartner | null {
  if (partner.status !== "active") return null;
  return {
    id: partner.id,
    salonId: partner.salonId,
    partnerType: partner.partnerType,
    status: "active",
    displayName: partner.displayName,
    bio: partner.bio,
    verifiedAt: partner.verifiedAt,
    isDemo: partner.isDemo,
  };
}

export function mapPartnerService(row: ServiceRow): PartnerService {
  return {
    id: row.id,
    partnerId: row.partner_id,
    categorySlug: row.category_slug,
    name: row.name,
    description: row.description,
    pricingType: row.pricing_type,
    priceCents: row.price_cents,
    priceMaxCents: row.price_max_cents,
    currency: row.currency,
    durationMinutes: row.duration_minutes,
    travelFeeCents: row.travel_fee_cents,
    minNoticeMinutes: row.min_notice_minutes,
    attributes: row.attributes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPartnerArea(row: AreaRow): PartnerServiceArea {
  return {
    id: row.id,
    partnerId: row.partner_id,
    serviceId: row.service_id,
    mode: row.mode,
    suburbId: row.suburb_id,
    centerLat: row.center_lat,
    centerLng: row.center_lng,
    radiusKm: row.radius_km,
    postcodes: row.postcodes,
    createdAt: row.created_at,
  };
}

export function mapAvailability(row: AvailabilityRow): PartnerAvailabilityRule {
  return {
    id: row.id,
    partnerId: row.partner_id,
    timezone: row.timezone,
    weeklyWindows: row.weekly_windows as Json,
    blackouts: row.blackouts as Json,
    capacityPerSlot: row.capacity_per_slot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
