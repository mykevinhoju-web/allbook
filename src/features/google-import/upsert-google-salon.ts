import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { slugifyName } from "./map-place";
import type {
  GoogleImportPlaceResult,
  GooglePlaceSnapshot,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

type ExistingSalon = {
  id: string;
  claimed: boolean;
  slug: string;
  category_id: string | null;
  suburb_id: string | null;
  description: string | null;
};

async function resolveCategoryId(
  supabase: AnySupabase,
  categorySlug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("business_categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();
  return data?.id ?? null;
}

async function resolveSuburbId(
  supabase: AnySupabase,
  suburbName: string | null,
  city: string,
): Promise<string | null> {
  if (!suburbName) return null;
  const { data } = await supabase
    .from("suburbs")
    .select("id, name, city")
    .ilike("name", suburbName)
    .limit(5);
  if (!data?.length) return null;
  const exactCity = data.find(
    (s) => s.city.toLowerCase() === city.toLowerCase(),
  );
  return (exactCity ?? data[0])?.id ?? null;
}

async function ensureUniqueSlug(
  supabase: AnySupabase,
  base: string,
  excludeId?: string,
): Promise<string> {
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await supabase
      .from("salons")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || (excludeId && data.id === excludeId)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Upsert a Google snapshot into salons by place_id.
 * Never duplicates. Never overwrites owner-managed fields when claimed.
 */
export async function upsertGoogleSalon(
  supabase: AnySupabase,
  snapshot: GooglePlaceSnapshot,
): Promise<GoogleImportPlaceResult> {
  const { data: existing, error: existingError } = await supabase
    .from("salons")
    .select("id, claimed, slug, category_id, suburb_id, description")
    .eq("google_place_id", snapshot.placeId)
    .maybeSingle();

  if (existingError) {
    return {
      placeId: snapshot.placeId,
      name: snapshot.name,
      action: "skipped",
      error: existingError.message,
    };
  }

  const categoryId =
    (existing as ExistingSalon | null)?.category_id ??
    (await resolveCategoryId(supabase, snapshot.categorySlug));
  const suburbId =
    (existing as ExistingSalon | null)?.suburb_id ??
    (await resolveSuburbId(supabase, snapshot.suburb, snapshot.city));

  const coverImage = snapshot.photos[0]?.mediaUrl ?? null;
  const now = new Date().toISOString();
  const googlePhotos = snapshot.photos.map((p) => ({
    name: p.name,
    widthPx: p.widthPx ?? null,
    heightPx: p.heightPx ?? null,
  }));

  if (existing) {
    const row = existing as ExistingSalon;

    const { data: ownerRow } = await supabase
      .from("salon_owners")
      .select("id")
      .eq("salon_id", row.id)
      .maybeSingle();
    const isClaimed = row.claimed || Boolean(ownerRow);

    if (isClaimed) {
      // Google snapshot fields only — never owner catalog / branding / copy.
      const { error } = await supabase
        .from("salons")
        .update({
          claimed: true,
          rating: snapshot.rating,
          review_count: snapshot.reviewCount,
          google_categories: snapshot.googleCategories,
          google_photos: googlePhotos,
          google_synced_at: now,
          updated_at: now,
        })
        .eq("id", row.id);
      if (error) {
        return {
          placeId: snapshot.placeId,
          name: snapshot.name,
          action: "skipped",
          salonId: row.id,
          error: error.message,
        };
      }
      return {
        placeId: snapshot.placeId,
        name: snapshot.name,
        action: "updated",
        salonId: row.id,
      };
    }

    const { error } = await supabase
      .from("salons")
      .update({
        name: snapshot.name,
        phone: snapshot.phone,
        website: snapshot.website,
        address: snapshot.address,
        suburb: snapshot.suburb,
        city: snapshot.city,
        state: snapshot.state,
        postcode: snapshot.postcode,
        country: snapshot.country,
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        rating: snapshot.rating,
        review_count: snapshot.reviewCount,
        opening_hours: snapshot.openingHours as Record<string, unknown>,
        cover_image: coverImage ?? undefined,
        primary_service: snapshot.primaryService,
        category_id: categoryId,
        suburb_id: suburbId,
        source: "google",
        claimed: false,
        verified: false,
        registration_method: "google",
        google_categories: snapshot.googleCategories,
        google_photos: googlePhotos,
        google_synced_at: now,
        updated_at: now,
      })
      .eq("id", row.id);

    if (error) {
      return {
        placeId: snapshot.placeId,
        name: snapshot.name,
        action: "skipped",
        salonId: row.id,
        error: error.message,
      };
    }

    await syncGoogleGallery(supabase, row.id, snapshot, false);
    return {
      placeId: snapshot.placeId,
      name: snapshot.name,
      action: "updated",
      salonId: row.id,
    };
  }

  const slug = await ensureUniqueSlug(
    supabase,
    slugifyName(snapshot.name, snapshot.suburb),
  );

  const { data: inserted, error: insertError } = await supabase
    .from("salons")
    .insert({
      name: snapshot.name,
      slug,
      description: null,
      phone: snapshot.phone,
      website: snapshot.website,
      address: snapshot.address,
      suburb: snapshot.suburb,
      city: snapshot.city,
      state: snapshot.state,
      postcode: snapshot.postcode,
      country: snapshot.country,
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      rating: snapshot.rating,
      review_count: snapshot.reviewCount,
      opening_hours: snapshot.openingHours as Record<string, unknown>,
      cover_image: coverImage,
      primary_service: snapshot.primaryService,
      starting_price: 0,
      category_id: categoryId,
      suburb_id: suburbId,
      source: "google",
      claimed: false,
      verified: false,
      registration_method: "google",
      google_place_id: snapshot.placeId,
      google_categories: snapshot.googleCategories,
      google_photos: googlePhotos,
      google_synced_at: now,
      booking_enabled: false,
      accept_new_customers: true,
      amenities: [],
      service_tags: [],
      languages: [],
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      placeId: snapshot.placeId,
      name: snapshot.name,
      action: "skipped",
      error: insertError?.message ?? "Insert failed",
    };
  }

  await syncGoogleGallery(supabase, inserted.id, snapshot, true);
  return {
    placeId: snapshot.placeId,
    name: snapshot.name,
    action: "inserted",
    salonId: inserted.id,
  };
}

async function syncGoogleGallery(
  supabase: AnySupabase,
  salonId: string,
  snapshot: GooglePlaceSnapshot,
  isNew: boolean,
) {
  if (snapshot.photos.length === 0) return;
  if (!isNew) {
    await supabase.from("salon_images").delete().eq("salon_id", salonId);
  }
  await supabase.from("salon_images").insert(
    snapshot.photos.map((photo, index) => ({
      salon_id: salonId,
      url: photo.mediaUrl,
      alt: `${snapshot.name} photo ${index + 1}`,
      sort_order: index,
    })),
  );
}
