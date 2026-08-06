import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveCategoryFromService } from "@/features/category";
import type { Database } from "@/types/database";

import { splitOpeningHoursPayload } from "./opening-hours-settings";
import {
  PLATFORM_DEMO_SALON_SLUG,
  type BusinessProfile,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

type SalonRow = Database["public"]["Tables"]["salons"]["Row"];

function mapBusiness(row: SalonRow): BusinessProfile {
  const { hours, settings } = splitOpeningHoursPayload(row.opening_hours);
  const category =
    resolveCategoryFromService(row.primary_service) ??
    resolveCategoryFromService("Hair");
  const categorySlug = category?.slug ?? "hair";

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    logo: row.logo,
    coverImage: row.cover_image,
    address: row.address ?? "",
    suburb: row.suburb ?? "",
    city: row.city,
    state: row.state,
    postcode: row.postcode ?? "",
    country: row.country,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    openingHours: hours,
    social: {
      instagram: row.social_instagram ?? "",
      facebook: row.social_facebook ?? "",
      tiktok: row.social_tiktok ?? "",
    },
    settings: {
      bookingEnabled: settings.bookingEnabled ?? true,
      acceptNewCustomers: settings.acceptNewCustomers ?? true,
      verified: row.verified,
      featured: settings.featured ?? false,
    },
    categorySlug,
    publicPath: `/${categorySlug}/${row.slug}`,
    updatedAt: row.updated_at,
  };
}

/**
 * Load salon business profile from Supabase `salons` (no mocks).
 */
export async function getBusiness(
  supabase: AnySupabase,
  options: { salonId?: string; slug?: string } = {},
): Promise<{ business: BusinessProfile | null; error: string | null }> {
  const salonId = options.salonId?.trim();
  const slug = (options.slug ?? PLATFORM_DEMO_SALON_SLUG).trim();

  let query = supabase.from("salons").select("*");
  if (salonId) {
    query = query.eq("id", salonId);
  } else {
    query = query.eq("slug", slug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return { business: null, error: error.message };
  }
  if (!data) {
    return { business: null, error: null };
  }

  return { business: mapBusiness(data as SalonRow), error: null };
}
