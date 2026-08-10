import { buildGeocodeAddress } from "@/lib/google-maps";

export type PlacesLatLng = { lat: number; lng: number };

export type PlacesApiPlace = {
  id?: string;
  name?: string;
  types?: string[];
  primaryType?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  shortFormattedAddress?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
  displayName?: { text?: string; languageCode?: string };
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  regularOpeningHours?: {
    periods?: Array<{
      open?: { day?: number; hour?: number; minute?: number };
      close?: { day?: number; hour?: number; minute?: number };
    }>;
    weekdayDescriptions?: string[];
  };
  photos?: Array<{
    name?: string;
    widthPx?: number;
    heightPx?: number;
  }>;
};

export type TextSearchPage = {
  places: PlacesApiPlace[];
  nextPageToken: string | null;
};

export class PlacesSearchError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "PlacesSearchError";
  }
}

export function isTransientPlacesStatus(status: number): boolean {
  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.name",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.addressComponents",
  "places.location",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.photos",
  "places.types",
  "places.primaryType",
  "places.googleMapsUri",
  "places.businessStatus",
  "nextPageToken",
].join(",");

function getPlacesApiKey(): string {
  const key =
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Google Places API key missing. Set GOOGLE_PLACES_API_KEY (preferred) or GOOGLE_MAPS_API_KEY.",
    );
  }
  return key;
}

export function buildPlacesPhotoMediaUrl(
  photoName: string,
  maxWidthPx = 1200,
): string {
  // Public proxy — never embed the API key in stored salon image URLs.
  const params = new URLSearchParams({
    name: photoName,
    w: String(maxWidthPx),
  });
  return `/api/places/photo?${params}`;
}

/**
 * Geocode a city/suburb for Places locationBias (discovery only).
 */
export async function geocodeImportCenter(input: {
  city: string;
  state: string;
  country: string;
}): Promise<PlacesLatLng | null> {
  const key = getPlacesApiKey();
  const address = buildGeocodeAddress(
    `${input.city}, ${input.state}, ${input.country}`,
  );
  const params = new URLSearchParams({
    address,
    key,
  });
  if (/australia/i.test(input.country)) {
    params.set("components", "country:AU");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
  );
  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }
  const payload = (await response.json()) as {
    status: string;
    results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
  };
  if (payload.status !== "OK" || !payload.results?.[0]) return null;
  const loc = payload.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

export type SearchTextParams = {
  textQuery: string;
  includedType?: string;
  pageSize?: number;
  pageToken?: string | null;
  locationBias?: {
    center: PlacesLatLng;
    radiusMeters: number;
  };
  regionCode?: string;
};

/**
 * Places API (New) Text Search — discovery only.
 * Marketplace search never calls this at query time.
 */
export async function searchTextPlaces(
  params: SearchTextParams,
): Promise<TextSearchPage> {
  const key = getPlacesApiKey();
  const body: Record<string, unknown> = {
    textQuery: params.textQuery,
    languageCode: "en",
    pageSize: Math.min(20, Math.max(1, params.pageSize ?? 20)),
  };
  if (params.includedType) body.includedType = params.includedType;
  if (params.pageToken) body.pageToken = params.pageToken;
  if (params.regionCode) body.regionCode = params.regionCode;
  if (params.locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: params.locationBias.center.lat,
          longitude: params.locationBias.center.lng,
        },
        radius: params.locationBias.radiusMeters,
      },
    };
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new PlacesSearchError(
      `Places searchText failed (${response.status}): ${text.slice(0, 500)}`,
      response.status,
    );
  }

  const payload = (await response.json()) as {
    places?: PlacesApiPlace[];
    nextPageToken?: string;
  };

  return {
    places: payload.places ?? [],
    nextPageToken: payload.nextPageToken ?? null,
  };
}

/**
 * Text Search with retries for transient HTTP errors (503, 429, 5xx…).
 * `maxRetries` = extra attempts after the first failure (default 3).
 */
export async function searchTextPlacesWithRetry(
  params: SearchTextParams,
  options: { maxRetries?: number; baseDelayMs?: number } = {},
): Promise<TextSearchPage> {
  const maxRetries = Math.max(0, options.maxRetries ?? 3);
  const baseDelayMs = Math.max(100, options.baseDelayMs ?? 500);
  let attempt = 0;

  for (;;) {
    try {
      return await searchTextPlaces(params);
    } catch (error) {
      const status =
        error instanceof PlacesSearchError ? error.status : undefined;
      const canRetry =
        status != null &&
        isTransientPlacesStatus(status) &&
        attempt < maxRetries;
      if (!canRetry) throw error;
      const delay = baseDelayMs * 2 ** attempt;
      attempt += 1;
      await sleep(delay);
    }
  }
}

const DETAIL_FIELD_MASK = [
  "id",
  "name",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "addressComponents",
  "location",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "regularOpeningHours",
  "photos",
  "types",
  "primaryType",
  "googleMapsUri",
  "businessStatus",
  "editorialSummary",
  "generativeSummary",
  "reviews",
].join(",");

export class PlaceDetailsError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "PlaceDetailsError";
  }
}

/**
 * Place Details (New) — used when admin imports a selected place_id.
 */
export async function getPlaceDetails(
  placeId: string,
): Promise<PlacesApiPlace> {
  const key = getPlacesApiKey();
  const id = placeId.startsWith("places/")
    ? placeId.slice("places/".length)
    : placeId;

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new PlaceDetailsError(
      `Place Details failed (${response.status}): ${text.slice(0, 400)}`,
      response.status,
    );
  }

  return (await response.json()) as PlacesApiPlace;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
