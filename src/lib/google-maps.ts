export type LatLngLiteral = {
  lat: number;
  lng: number;
};

/** Brisbane CBD — default map center when no location query. */
export const DEFAULT_MAP_CENTER: LatLngLiteral = {
  lat: -27.4698,
  lng: 153.0251,
};

export const DEFAULT_MAP_ZOOM = 12;
export const SEARCH_MAP_ZOOM = 13;

export function getGoogleMapsBrowserKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return key || undefined;
}

/**
 * Bias geocoding toward SE Queensland for suburb-style queries
 * from the marketplace search toolbar.
 */
export function buildGeocodeAddress(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) return "";
  if (/queensland|qld|australia/i.test(trimmed)) return trimmed;
  return `${trimmed}, Queensland, Australia`;
}
