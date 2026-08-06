import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getBusiness } from "./getBusiness";
import { mergeOpeningHoursPayload } from "./opening-hours-settings";
import type { BusinessProfile, BusinessProfileInput } from "./types";

type AnySupabase = SupabaseClient<Database>;

export function validateBusinessInput(input: BusinessProfileInput): string | null {
  if (!input.name.trim()) return "Business name is required.";
  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    return "Latitude and longitude are required.";
  }
  if (input.latitude < -90 || input.latitude > 90) {
    return "Latitude must be between -90 and 90.";
  }
  if (input.longitude < -180 || input.longitude > 180) {
    return "Longitude must be between -180 and 180.";
  }
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return "Enter a valid email address.";
  }
  return null;
}

/**
 * Persist business profile fields onto existing `salons` columns only.
 */
export async function updateBusiness(
  supabase: AnySupabase,
  salonId: string,
  input: BusinessProfileInput,
  options: { allowFeatured?: boolean } = {},
): Promise<{ business: BusinessProfile | null; error: string | null }> {
  const validationError = validateBusinessInput(input);
  if (validationError) {
    return { business: null, error: validationError };
  }

  const existing = await getBusiness(supabase, { salonId });
  if (existing.error) return existing;
  if (!existing.business) {
    return { business: null, error: "Salon not found." };
  }

  const featured = options.allowFeatured
    ? input.settings.featured
    : existing.business.settings.featured;

  const openingHours = mergeOpeningHoursPayload(input.openingHours, {
    bookingEnabled: input.settings.bookingEnabled,
    acceptNewCustomers: input.settings.acceptNewCustomers,
    featured,
  });

  const { error } = await supabase
    .from("salons")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
      website: input.website.trim() || null,
      logo: input.logo?.trim() || null,
      cover_image: input.coverImage?.trim() || null,
      address: input.address.trim() || null,
      suburb: input.suburb.trim() || null,
      latitude: input.latitude,
      longitude: input.longitude,
      opening_hours: openingHours,
      social_instagram: input.social.instagram.trim() || null,
      social_facebook: input.social.facebook.trim() || null,
      social_tiktok: input.social.tiktok.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", salonId);

  if (error) {
    return { business: null, error: error.message };
  }

  return getBusiness(supabase, { salonId });
}
