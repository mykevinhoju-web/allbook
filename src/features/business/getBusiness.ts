import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveCategoryFromService } from "@/features/category";
import type { Database } from "@/types/database";

import { parseBusinessOpeningHours } from "./opening-hours-settings";
import type { BusinessProfile } from "./types";

type AnySupabase = SupabaseClient<Database>;

type SalonRow = Database["public"]["Tables"]["salons"]["Row"];

function mapBusiness(row: SalonRow): BusinessProfile {
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
    openingHours: parseBusinessOpeningHours(row.opening_hours),
    social: {
      instagram: row.social_instagram ?? "",
      facebook: row.social_facebook ?? "",
      tiktok: row.social_tiktok ?? "",
    },
    settings: {
      bookingEnabled: row.booking_enabled ?? true,
      acceptNewCustomers: row.accept_new_customers ?? true,
      verified: row.verified,
      // featured column does not exist on salons — UI-only placeholder
      featured: false,
    },
    categorySlug,
    publicPath: `/${categorySlug}/${row.slug}`,
    updatedAt: row.updated_at,
  };
}

/**
 * Load salon business profile from Supabase `salons` (no mocks / no demo slug).
 * Callers must pass salonId from the owner auth context.
 */
export async function getBusiness(
  supabase: AnySupabase,
  options: { salonId: string },
): Promise<{ business: BusinessProfile | null; error: string | null }> {
  const salonId = options.salonId?.trim();
  if (!salonId) {
    return { business: null, error: "salonId is required." };
  }

  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("id", salonId)
    .maybeSingle();

  if (error) {
    return { business: null, error: error.message };
  }
  if (!data) {
    return { business: null, error: null };
  }

  return { business: mapBusiness(data as SalonRow), error: null };
}
