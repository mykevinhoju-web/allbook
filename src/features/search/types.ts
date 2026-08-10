import type { SearchDistanceKm, SearchSort } from "./constants";
import {
  DEFAULT_SEARCH_DISTANCE_KM,
  DEFAULT_SEARCH_SORT,
  SEARCH_PAGE_SIZE,
  isSearchDistanceKm,
  isSearchSort,
} from "./constants";

export type SalonSearchFilters = {
  location: string;
  service: string;
  /** Exact suburb filter (indexed text match via RPC p_suburb) */
  suburb: string;
  /** Precise device / saved coordinates — skip string geocode when set. */
  latitude: number | null;
  longitude: number | null;
  radiusKm: SearchDistanceKm;
  sort: SearchSort;
  minRating: number | null;
  verifiedOnly: boolean;
  openNow: boolean;
  page: number;
  pageSize: number;
};

export type SalonSearchOrigin = {
  lat: number;
  lng: number;
  formattedAddress?: string;
};

/** Loose query/API input — always run through `normalizeSalonSearchFilters`. */
export type SalonSearchFiltersInput = {
  location?: string | null;
  service?: string | null;
  suburb?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radiusKm?: SearchDistanceKm | number | string | null;
  sort?: SearchSort | string | null;
  minRating?: number | string | null;
  verifiedOnly?: boolean | string | null;
  openNow?: boolean | string | null;
  page?: number | string | null;
  pageSize?: number | string | null;
};

function asBool(value: boolean | string | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return false;
}

export function normalizeSalonSearchFilters(
  input: SalonSearchFiltersInput = {},
): SalonSearchFilters {
  const radiusRaw = Number(input.radiusKm);
  const radiusKm = isSearchDistanceKm(radiusRaw)
    ? radiusRaw
    : DEFAULT_SEARCH_DISTANCE_KM;

  const sortRaw = String(input.sort ?? DEFAULT_SEARCH_SORT);
  const sort = isSearchSort(sortRaw) ? sortRaw : DEFAULT_SEARCH_SORT;

  const minRatingRaw = Number(input.minRating);
  const minRating =
    Number.isFinite(minRatingRaw) && minRatingRaw > 0
      ? Math.min(5, minRatingRaw)
      : null;

  const latitudeRaw =
    input.latitude == null || input.latitude === ""
      ? Number.NaN
      : Number(input.latitude);
  const longitudeRaw =
    input.longitude == null || input.longitude === ""
      ? Number.NaN
      : Number(input.longitude);
  const hasCoords =
    Number.isFinite(latitudeRaw) &&
    Number.isFinite(longitudeRaw) &&
    Math.abs(latitudeRaw) <= 90 &&
    Math.abs(longitudeRaw) <= 180 &&
    !(latitudeRaw === 0 && longitudeRaw === 0);

  return {
    location: (input.location ?? "").trim(),
    service: (input.service ?? "").trim(),
    suburb: (input.suburb ?? "").trim(),
    latitude: hasCoords ? latitudeRaw : null,
    longitude: hasCoords ? longitudeRaw : null,
    radiusKm,
    sort,
    minRating,
    verifiedOnly: asBool(input.verifiedOnly),
    openNow: asBool(input.openNow),
    page: Math.max(1, Number(input.page) || 1),
    pageSize: Math.max(1, Number(input.pageSize) || SEARCH_PAGE_SIZE),
  };
}
