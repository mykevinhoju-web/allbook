/**
 * Shared search query model for landing → category routes.
 * There is no generic /search page — category is required.
 */

import { BRISBANE_SUBURB_NAMES } from "@/features/search/brisbane-suburbs";
import {
  DEFAULT_SEARCH_DISTANCE_KM,
  DEFAULT_SEARCH_SORT,
  isSearchDistanceKm,
  isSearchSort,
  type SearchDistanceKm,
  type SearchSort,
} from "@/features/search/constants";
import { MARKETPLACE_CATEGORIES } from "@/features/category/constants";
import {
  resolveCategoryFromService,
  toLocationQueryParam,
} from "@/features/category/constants";

/** Prebuilt Greater Brisbane suburbs for location typeahead. */
export const LOCATION_SUGGESTIONS = BRISBANE_SUBURB_NAMES;

export type LocationSuggestion = (typeof LOCATION_SUGGESTIONS)[number];

/** Hero category options — driven by the category engine. */
export const SEARCH_CATEGORIES = MARKETPLACE_CATEGORIES.map((c) => c.label);
export type SearchCategoryLabel = (typeof SEARCH_CATEGORIES)[number];

/** @deprecated Prefer SEARCH_CATEGORIES — kept for older imports */
export const SEARCH_SERVICES = SEARCH_CATEGORIES;
export type SearchService = SearchCategoryLabel;

export type SearchQuery = {
  location: string;
  service: string;
  radiusKm: SearchDistanceKm;
  sort: SearchSort;
  /** Precise coordinates from "Near me" / saved preference. */
  lat: number | null;
  lng: number | null;
};

export const SEARCH_LOCATION_EMPTY_MESSAGE = "Please select a suburb";
export const SEARCH_CATEGORY_EMPTY_MESSAGE = "Please select a category";

export const DEFAULT_SEARCH_PLACEHOLDERS = {
  location: "Suburb or city",
  service: "Category",
  category: "Category",
} as const;

function parseCoord(
  value: number | string | null | undefined,
  maxAbs: number,
): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > maxAbs) return null;
  return n;
}

export function normalizeSearchQuery(
  query: {
    location?: string | null;
    service?: string | null;
    radiusKm?: SearchDistanceKm | number | string | null;
    sort?: SearchSort | string | null;
    lat?: number | string | null;
    lng?: number | string | null;
  } = {},
): SearchQuery {
  const radiusRaw = Number(query.radiusKm);
  const radiusKm = isSearchDistanceKm(radiusRaw)
    ? radiusRaw
    : DEFAULT_SEARCH_DISTANCE_KM;
  const sortRaw = String(query.sort ?? DEFAULT_SEARCH_SORT);
  const sort = isSearchSort(sortRaw) ? sortRaw : DEFAULT_SEARCH_SORT;
  const lat = parseCoord(query.lat, 90);
  const lng = parseCoord(query.lng, 180);
  const hasCoords = lat != null && lng != null;

  return {
    location: (query.location ?? "").trim(),
    service: (query.service ?? "").trim(),
    radiusKm,
    sort,
    lat: hasCoords ? lat : null,
    lng: hasCoords ? lng : null,
  };
}

export function isSearchLocationValid(location: string): boolean {
  return location.trim().length > 0;
}

export function isSearchCategoryValid(service: string): boolean {
  return Boolean(resolveCategoryFromService(service.trim()));
}

export function filterLocationSuggestions(
  input: string,
  limit = 8,
): string[] {
  const q = input.trim().toLowerCase();
  if (!q) return [...LOCATION_SUGGESTIONS].slice(0, limit);

  const starts: string[] = [];
  const contains: string[] = [];
  for (const suburb of LOCATION_SUGGESTIONS) {
    const lower = suburb.toLowerCase();
    if (lower.startsWith(q)) starts.push(suburb);
    else if (lower.includes(q)) contains.push(suburb);
  }
  return [...starts, ...contains].slice(0, limit);
}

function toQueryString(
  query: SearchQuery,
  options: { omitService?: boolean } = {},
): string {
  const params = new URLSearchParams();
  if (query.location) {
    params.set("location", toLocationQueryParam(query.location));
  }
  if (query.lat != null && query.lng != null) {
    params.set("lat", String(query.lat));
    params.set("lng", String(query.lng));
  }
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
 * Category routes only. Landing must choose a category before searching.
 */
export function buildSearchPath(query: Partial<SearchQuery>): string | null {
  const normalized = normalizeSearchQuery(query);
  const category = resolveCategoryFromService(normalized.service);
  if (!category) return null;

  return `/${category.slug}${toQueryString(normalized, { omitService: true })}`;
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
    lat: params.get("lat") ?? defaults.lat ?? undefined,
    lng: params.get("lng") ?? defaults.lng ?? undefined,
  });
}

export function isKnownSearchService(value: string): value is SearchService {
  return (SEARCH_SERVICES as readonly string[]).includes(value);
}
