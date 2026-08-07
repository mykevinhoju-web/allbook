import type { DayOfWeek, OpeningHours } from "@/types/salon";

import type { PlacesCategoryMapping } from "./category-map";
import {
  buildPlacesPhotoMediaUrl,
  type PlacesApiPlace,
} from "./places-client";
import type { GooglePhotoRef, GooglePlaceSnapshot } from "./types";

const GOOGLE_DAY_TO_KEY: DayOfWeek[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

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

export function mapGoogleOpeningHours(
  place: PlacesApiPlace,
): OpeningHours {
  const hours: OpeningHours = {
    mon: { open: "09:00", close: "17:00", closed: true },
    tue: { open: "09:00", close: "17:00", closed: true },
    wed: { open: "09:00", close: "17:00", closed: true },
    thu: { open: "09:00", close: "17:00", closed: true },
    fri: { open: "09:00", close: "17:00", closed: true },
    sat: { open: "09:00", close: "17:00", closed: true },
    sun: { open: "09:00", close: "17:00", closed: true },
  };

  const periods = place.regularOpeningHours?.periods ?? [];
  for (const period of periods) {
    const openDay = period.open?.day;
    if (openDay == null) continue;
    const key = GOOGLE_DAY_TO_KEY[openDay];
    if (!key) continue;
    const openH = period.open?.hour ?? 0;
    const openM = period.open?.minute ?? 0;
    const closeH = period.close?.hour ?? 0;
    const closeM = period.close?.minute ?? 0;
    hours[key] = {
      open: `${pad2(openH)}:${pad2(openM)}`,
      close: `${pad2(closeH)}:${pad2(closeM)}`,
      closed: false,
    };
  }

  return hours;
}

export function mapGooglePhotos(
  place: PlacesApiPlace,
  maxPhotos: number,
): GooglePhotoRef[] {
  const photos = place.photos ?? [];
  const out: GooglePhotoRef[] = [];
  for (const photo of photos) {
    if (!photo.name) continue;
    out.push({
      name: photo.name,
      widthPx: photo.widthPx,
      heightPx: photo.heightPx,
      mediaUrl: buildPlacesPhotoMediaUrl(photo.name),
    });
    if (out.length >= maxPhotos) break;
  }
  return out;
}

function resolvePlaceId(place: PlacesApiPlace): string | null {
  if (place.id?.trim()) return place.id.trim();
  // Resource name form: places/ChIJ...
  const name = place.name?.trim();
  if (name?.startsWith("places/")) return name.slice("places/".length);
  return null;
}

/**
 * Map a Places API (New) place into an AllBook Google snapshot.
 */
export function mapPlaceToSnapshot(
  place: PlacesApiPlace,
  mapping: PlacesCategoryMapping,
  defaults: { city: string; state: string; country: string },
  maxPhotos: number,
): GooglePlaceSnapshot | null {
  const placeId = resolvePlaceId(place);
  const name = place.displayName?.text?.trim();
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!placeId || !name || lat == null || lng == null) return null;

  const suburb =
    component(place, "locality") ||
    component(place, "sublocality") ||
    component(place, "postal_town") ||
    defaults.city;

  const state =
    component(place, "administrative_area_level_1", true) ||
    component(place, "administrative_area_level_1") ||
    defaults.state;

  const postcode = component(place, "postal_code");
  const country =
    component(place, "country") || defaults.country;

  const streetNumber = component(place, "street_number");
  const route = component(place, "route");
  const street =
    streetNumber && route
      ? `${streetNumber} ${route}`
      : route || place.shortFormattedAddress || null;

  const categories = [
    ...(place.primaryType ? [place.primaryType] : []),
    ...(place.types ?? []),
  ];
  const googleCategories = [...new Set(categories.filter(Boolean))];
  const businessStatus = place.businessStatus?.trim() || null;

  return {
    placeId,
    name,
    address: street || place.formattedAddress || null,
    suburb,
    city: defaults.city,
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
    openingHours: mapGoogleOpeningHours(place),
    photos: mapGooglePhotos(place, maxPhotos),
    googleCategories,
    primaryType: place.primaryType ?? null,
    categorySlug: mapping.categorySlug,
    primaryService: mapping.primaryService,
    businessStatus,
  };
}

export function slugifyName(name: string, suburb: string | null): string {
  const base = `${name} ${suburb ?? ""}`
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, 80) || "salon";
}
