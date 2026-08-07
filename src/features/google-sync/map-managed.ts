import {
  mapGoogleOpeningHours,
  mapGooglePhotos,
} from "@/features/google-import/map-place";
import type { PlacesApiPlace } from "@/features/google-import/places-client";

import type { GoogleManagedSnapshot, GoogleSyncSalonRow } from "./types";

function component(
  place: PlacesApiPlace,
  type: string,
  short = false,
): string | null {
  const row = place.addressComponents?.find((c) => c.types?.includes(type));
  if (!row) return null;
  const value = short ? row.shortText : row.longText;
  return value?.trim() || null;
}

function resolvePlaceId(place: PlacesApiPlace): string | null {
  if (place.id?.trim()) return place.id.trim();
  const name = place.name?.trim();
  if (name?.startsWith("places/")) return name.slice("places/".length);
  return null;
}

/**
 * Map Place Details into Google-managed fields only.
 * Does not touch AllBook categories, cover, logo, description, services, etc.
 */
export function mapPlaceToManagedSnapshot(
  place: PlacesApiPlace,
  salon: Pick<
    GoogleSyncSalonRow,
    "city" | "state" | "country" | "suburb" | "google_place_id"
  >,
  maxPhotos = 8,
): GoogleManagedSnapshot | null {
  const placeId = resolvePlaceId(place) ?? salon.google_place_id;
  const name = place.displayName?.text?.trim();
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!placeId || !name || lat == null || lng == null) return null;

  const suburb =
    component(place, "locality") ||
    component(place, "sublocality") ||
    component(place, "postal_town") ||
    salon.suburb ||
    salon.city;

  const state =
    component(place, "administrative_area_level_1", true) ||
    component(place, "administrative_area_level_1") ||
    salon.state;

  const postcode = component(place, "postal_code");
  const country = component(place, "country") || salon.country;

  const streetNumber = component(place, "street_number");
  const route = component(place, "route");
  const street =
    streetNumber && route
      ? `${streetNumber} ${route}`
      : route || place.shortFormattedAddress || place.formattedAddress || null;

  const categories = [
    ...(place.primaryType ? [place.primaryType] : []),
    ...(place.types ?? []),
  ];
  const googleCategories = [...new Set(categories.filter(Boolean))];

  const businessStatus = place.businessStatus?.trim() || null;
  const permanentlyClosed =
    businessStatus?.toUpperCase() === "CLOSED_PERMANENTLY";

  const photos = mapGooglePhotos(place, maxPhotos).map((p) => ({
    name: p.name,
    widthPx: p.widthPx ?? null,
    heightPx: p.heightPx ?? null,
  }));

  return {
    placeId,
    name,
    address: street,
    suburb,
    city: salon.city,
    state,
    postcode,
    country,
    latitude: lat,
    longitude: lng,
    phone:
      place.nationalPhoneNumber?.trim() ||
      place.internationalPhoneNumber?.trim() ||
      null,
    website: place.websiteUri?.trim() || null,
    rating: typeof place.rating === "number" ? place.rating : 0,
    reviewCount:
      typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
    openingHours: mapGoogleOpeningHours(place) as unknown as Record<
      string,
      unknown
    >,
    googleCategories,
    photos,
    businessStatus,
    permanentlyClosed,
  };
}

export function hashInputFromSalonRow(
  salon: GoogleSyncSalonRow,
): import("./snapshot-hash").GoogleSnapshotHashInput {
  const photos = Array.isArray(salon.google_photos)
    ? (salon.google_photos as Array<{ name?: string }>)
        .map((p) => p.name)
        .filter((n): n is string => Boolean(n))
        .sort()
    : [];

  return {
    name: salon.name,
    address: salon.address,
    suburb: salon.suburb,
    city: salon.city,
    state: salon.state,
    postcode: salon.postcode,
    country: salon.country,
    latitude: Math.round(salon.latitude * 1e6) / 1e6,
    longitude: Math.round(salon.longitude * 1e6) / 1e6,
    phone: salon.phone,
    website: salon.website,
    rating: salon.rating,
    reviewCount: salon.review_count,
    openingHours: salon.opening_hours ?? {},
    googleCategories: [...(salon.google_categories ?? [])].sort(),
    photoNames: photos,
    businessStatus: salon.google_business_status,
  };
}
