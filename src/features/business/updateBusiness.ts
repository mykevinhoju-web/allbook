import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getBusiness } from "./getBusiness";
import { serializeBusinessOpeningHours } from "./opening-hours-settings";
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
 * Persist business profile onto `salons` columns.
 * Hours → opening_hours jsonb only. Settings → booking_enabled / accept_new_customers.
 */
export async function updateBusiness(
  supabase: AnySupabase,
  salonId: string,
  input: BusinessProfileInput,
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

  const nextName = input.name.trim();
  const nameChanged =
    nextName.toLowerCase() !== existing.business.name.trim().toLowerCase();

  const { error } = await supabase
    .from("salons")
    .update({
      name: nextName,
      // Owner renamed → Google Sync must not overwrite salons.name.
      ...(nameChanged ? { owner_name_override: true } : {}),
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
      opening_hours: serializeBusinessOpeningHours(input.openingHours),
      social_instagram: input.social.instagram.trim() || null,
      social_facebook: input.social.facebook.trim() || null,
      social_tiktok: input.social.tiktok.trim() || null,
      booking_enabled: input.settings.bookingEnabled,
      accept_new_customers: input.settings.acceptNewCustomers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", salonId);

  if (error) {
    return { business: null, error: error.message };
  }

  return getBusiness(supabase, { salonId });
}
