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

/** Suburb-level zoom — closer than city-wide, without framing a large radius. */
export const SUBURB_SEARCH_ZOOM = 13;

/**
 * Bounds around result markers so the map zooms to the cluster,
 * not the full distance-filter circle (e.g. 20 km ≈ all of Brisbane).
 */
export function boundsForSalonMarkers(
  salons: Array<{ latitude: number; longitude: number }>,
  /** Minimum padding so a single pin still has context */
  minPaddingKm = 1.2,
): LatLngBoundsLiteral | null {
  if (salons.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const salon of salons) {
    minLat = Math.min(minLat, salon.latitude);
    maxLat = Math.max(maxLat, salon.latitude);
    minLng = Math.min(minLng, salon.longitude);
    maxLng = Math.max(maxLng, salon.longitude);
  }

  const midLat = (minLat + maxLat) / 2;
  const cosLat = Math.max(Math.cos((midLat * Math.PI) / 180), 0.01);
  const padLat = Math.max((maxLat - minLat) * 0.25, minPaddingKm / 111.32);
  const padLng = Math.max(
    (maxLng - minLng) * 0.25,
    minPaddingKm / (111.32 * cosLat),
  );

  return {
    north: maxLat + padLat,
    south: minLat - padLat,
    east: maxLng + padLng,
    west: minLng - padLng,
  };
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
