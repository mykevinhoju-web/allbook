export type LatLngLiteral = {
  lat: number;
  lng: number;
};

/** Brisbane CBD — default map center. */
export const DEFAULT_MAP_CENTER: LatLngLiteral = {
  lat: -27.4698,
  lng: 153.0251,
};

export const DEFAULT_MAP_ZOOM = 11;
export const SEARCH_MAP_ZOOM = 13;
/** Zoom when a salon card / marker is focused */
export const SELECTED_SALON_ZOOM = 15;

export type LatLngBoundsLiteral = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/**
 * Geographic bounds covering ~`radiusKm` around a search origin.
 * Used so the marketplace map frames the active search radius (not city-wide).
 */
export function boundsForSearchRadius(
  center: LatLngLiteral,
  radiusKm: number,
  /** Extra margin so the circle isn't clipped at the map edges */
  paddingFactor = 1.15,
): LatLngBoundsLiteral {
  const km = Math.max(1, radiusKm) * paddingFactor;
  const latDelta = km / 111.32;
  const cosLat = Math.max(Math.cos((center.lat * Math.PI) / 180), 0.01);
  const lngDelta = km / (111.32 * cosLat);
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta,
  };
}

/** Fallback zoom when fitBounds is unavailable. */
export function zoomForSearchRadiusKm(radiusKm: number): number {
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 20) return 11;
  if (radiusKm <= 50) return 10;
  return 9;
}

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
