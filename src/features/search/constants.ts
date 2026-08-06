/** Allowed distance filters (km). */
export const SEARCH_DISTANCE_KM = [5, 10, 20, 50] as const;
export type SearchDistanceKm = (typeof SEARCH_DISTANCE_KM)[number];
export const DEFAULT_SEARCH_DISTANCE_KM: SearchDistanceKm = 20;

export const SEARCH_SORT_OPTIONS = [
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
  { value: "price", label: "Price" },
  { value: "newest", label: "Newest" },
] as const;

export type SearchSort = (typeof SEARCH_SORT_OPTIONS)[number]["value"];
export const DEFAULT_SEARCH_SORT: SearchSort = "distance";

export const SEARCH_PAGE_SIZE = 100;

export const SEARCH_SERVICE_FILTERS = [
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

export type SearchServiceFilter = (typeof SEARCH_SERVICE_FILTERS)[number];

export function isSearchDistanceKm(value: number): value is SearchDistanceKm {
  return (SEARCH_DISTANCE_KM as readonly number[]).includes(value);
}

export function isSearchSort(value: string): value is SearchSort {
  return SEARCH_SORT_OPTIONS.some((option) => option.value === value);
}

/**
 * Map toolbar service labels to DB `primary_service` values.
 * Keep aliases centralized — UI must not hardcode mappings.
 */
export function resolveServiceFilterValues(service: string): string[] | null {
  const key = service.trim();
  if (!key) return null;

  const aliases: Record<string, string[]> = {
    Hair: ["Hair", "Barber"],
    Barber: ["Barber", "Hair"],
    Lashes: ["Brows", "Lashes"],
    Brows: ["Brows", "Lashes"],
  };

  return aliases[key] ?? [key];
}
