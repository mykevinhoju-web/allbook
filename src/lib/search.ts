/**
 * Shared search query model for landing → marketplace / category routes.
 */

import { resolveCategoryFromService } from "@/features/category/constants";
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
  query: {
    location?: string | null;
    service?: string | null;
    radiusKm?: SearchDistanceKm | number | string | null;
    sort?: SearchSort | string | null;
  } = {},
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

function toQueryString(
  query: SearchQuery,
  options: { omitService?: boolean } = {},
): string {
  const params = new URLSearchParams();
  if (query.location) params.set("location", query.location);
  if (!options.omitService && query.service) {
    params.set("service", query.service);
  }
  if (query.radiusKm !== DEFAULT_SEARCH_DISTANCE_KM) {
    params.set("radius", String(query.radiusKm));
  }
  if (query.sort !== DEFAULT_SEARCH_SORT) {
    params.set("sort", query.sort);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Prefer category routes when service maps to a marketplace category.
 * Category engine owns the slug list; this keeps URL builders shared.
 */
export function buildSearchPath(query: Partial<SearchQuery>): string {
  const normalized = normalizeSearchQuery(query);
  const category = resolveCategoryFromService(normalized.service);

  if (category) {
    return `/${category.slug}${toQueryString(normalized, { omitService: true })}`;
  }

  return `/search${toQueryString(normalized)}`;
}

export function parseSearchParams(
  params: URLSearchParams | { get(name: string): string | null },
  defaults: Partial<SearchQuery> = {},
): SearchQuery {
  return normalizeSearchQuery({
    location: params.get("location") ?? defaults.location ?? "",
    service: params.get("service") ?? defaults.service ?? "",
    radiusKm: params.get("radius") ?? defaults.radiusKm ?? undefined,
    sort: params.get("sort") ?? defaults.sort ?? undefined,
  });
}

export function isKnownSearchService(value: string): value is SearchService {
  return (SEARCH_SERVICES as readonly string[]).includes(value);
}
