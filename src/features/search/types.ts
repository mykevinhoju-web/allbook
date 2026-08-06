import type { SearchDistanceKm, SearchSort } from "./constants";
import {
  DEFAULT_SEARCH_DISTANCE_KM,
  DEFAULT_SEARCH_SORT,
  isSearchDistanceKm,
  isSearchSort,
} from "./constants";

export type SalonSearchFilters = {
  location: string;
  service: string;
  radiusKm: SearchDistanceKm;
  sort: SearchSort;
  page?: number;
  pageSize?: number;
};

export type SalonSearchOrigin = {
  lat: number;
  lng: number;
  formattedAddress?: string;
};

export function normalizeSalonSearchFilters(
  input: Partial<SalonSearchFilters> & { radiusKm?: number | string },
): SalonSearchFilters {
  const radiusRaw = Number(input.radiusKm);
  const radiusKm = isSearchDistanceKm(radiusRaw)
    ? radiusRaw
    : DEFAULT_SEARCH_DISTANCE_KM;

  const sortRaw = String(input.sort ?? DEFAULT_SEARCH_SORT);
  const sort = isSearchSort(sortRaw) ? sortRaw : DEFAULT_SEARCH_SORT;

  return {
    location: (input.location ?? "").trim(),
    service: (input.service ?? "").trim(),
    radiusKm,
    sort,
    page: Math.max(1, Number(input.page) || 1),
    pageSize: Math.max(1, Number(input.pageSize) || 100),
  };
}
