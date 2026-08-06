/**
 * Shared search query model for landing → /search.
 */

import {
  DEFAULT_SEARCH_DISTANCE_KM,
  DEFAULT_SEARCH_SORT,
  SEARCH_SERVICE_FILTERS,
  isSearchDistanceKm,
  isSearchSort,
  type SearchDistanceKm,
  type SearchSort,
} from "@/features/search/constants";

export const LOCATION_SUGGESTIONS = [
  "Aspley",
  "Chermside",
  "Sunnybank",
  "Indooroopilly",
  "Carindale",
  "New Farm",
  "Paddington",
] as const;

export type LocationSuggestion = (typeof LOCATION_SUGGESTIONS)[number];

export const SEARCH_SERVICES = SEARCH_SERVICE_FILTERS;
export type SearchService = (typeof SEARCH_SERVICES)[number];

export type SearchQuery = {
  location: string;
  service: string;
  radiusKm: SearchDistanceKm;
  sort: SearchSort;
};

export const SEARCH_LOCATION_EMPTY_MESSAGE = "Please select a suburb";

export const DEFAULT_SEARCH_PLACEHOLDERS = {
  location: "Suburb or city",
  service: "All services",
} as const;

export function normalizeSearchQuery(
  query: Partial<SearchQuery> & { radiusKm?: number | string },
): SearchQuery {
  const radiusRaw = Number(query.radiusKm);
  const radiusKm = isSearchDistanceKm(radiusRaw)
    ? radiusRaw
    : DEFAULT_SEARCH_DISTANCE_KM;
  const sortRaw = String(query.sort ?? DEFAULT_SEARCH_SORT);
  const sort = isSearchSort(sortRaw) ? sortRaw : DEFAULT_SEARCH_SORT;

  return {
    location: (query.location ?? "").trim(),
    service: (query.service ?? "").trim(),
    radiusKm,
    sort,
  };
}

export function isSearchLocationValid(location: string): boolean {
  return location.trim().length > 0;
}

export function filterLocationSuggestions(
  input: string,
  limit = 6,
): string[] {
  const q = input.trim().toLowerCase();
  if (!q) return [...LOCATION_SUGGESTIONS].slice(0, limit);

  return LOCATION_SUGGESTIONS.filter((suburb) =>
    suburb.toLowerCase().includes(q),
  ).slice(0, limit);
}

export function buildSearchPath(query: Partial<SearchQuery>): string {
  const normalized = normalizeSearchQuery(query);
  const params = new URLSearchParams();
  if (normalized.location) params.set("location", normalized.location);
  if (normalized.service) params.set("service", normalized.service);
  if (normalized.radiusKm !== DEFAULT_SEARCH_DISTANCE_KM) {
    params.set("radius", String(normalized.radiusKm));
  }
  if (normalized.sort !== DEFAULT_SEARCH_SORT) {
    params.set("sort", normalized.sort);
  }
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function parseSearchParams(
  params: URLSearchParams | { get(name: string): string | null },
): SearchQuery {
  return normalizeSearchQuery({
    location: params.get("location") ?? "",
    service: params.get("service") ?? "",
    radiusKm: params.get("radius") ?? undefined,
    sort: (params.get("sort") as SearchSort | null) ?? undefined,
  });
}

export function isKnownSearchService(value: string): value is SearchService {
  return (SEARCH_SERVICES as readonly string[]).includes(value);
}
