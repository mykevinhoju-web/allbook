/**
 * Shared search query model for landing → /search.
 * Ready to extend later with Maps / Supabase without changing call sites.
 */

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

export const SEARCH_SERVICES = [
  "Hair",
  "Barber",
  "Nails",
  "Spa",
  "Massage",
  "Facial",
  "Waxing",
  "Brows",
  "Lashes",
] as const;

export type SearchService = (typeof SEARCH_SERVICES)[number];

export type SearchQuery = {
  location: string;
  service: string;
};

export const SEARCH_LOCATION_EMPTY_MESSAGE = "Please select a suburb";

export const DEFAULT_SEARCH_PLACEHOLDERS = {
  location: "Suburb or city",
  service: "All services",
} as const;

/** Maps URL/service labels onto salon mock tags (temporary). */
export const SERVICE_TO_TAGS: Record<string, string[]> = {
  Hair: ["Hair"],
  Barber: ["Hair"],
  Nails: ["Nails"],
  Spa: ["Spa"],
  Massage: ["Massage"],
  Facial: ["Facial"],
  Waxing: ["Waxing"],
  Brows: ["Brows"],
  Lashes: ["Brows"],
};

export function normalizeSearchQuery(query: Partial<SearchQuery>): SearchQuery {
  return {
    location: (query.location ?? "").trim(),
    service: (query.service ?? "").trim(),
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
  const { location, service } = normalizeSearchQuery(query);
  const params = new URLSearchParams();
  if (location) params.set("location", location);
  if (service) params.set("service", service);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function parseSearchParams(
  params: URLSearchParams | { get(name: string): string | null },
): SearchQuery {
  return normalizeSearchQuery({
    location: params.get("location") ?? "",
    service: params.get("service") ?? "",
  });
}

export function isKnownSearchService(value: string): value is SearchService {
  return (SEARCH_SERVICES as readonly string[]).includes(value);
}
