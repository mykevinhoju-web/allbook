"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  SEARCH_CATEGORY_EMPTY_MESSAGE,
  SEARCH_LOCATION_EMPTY_MESSAGE,
  buildSearchPath,
  filterLocationSuggestions,
  isSearchCategoryValid,
  isSearchLocationValid,
  normalizeSearchQuery,
  type SearchQuery,
} from "@/lib/search";

export type UseSearchOptions = {
  /** Seed values (landing hero or category toolbar). */
  initial?: Partial<SearchQuery>;
};

/**
 * Landing / toolbar search state → category route.
 * Category is required — there is no generic /search page.
 */
export function useSearch(options: UseSearchOptions = {}) {
  const { initial } = options;
  const router = useRouter();

  const [location, setLocation] = useState(() => initial?.location ?? "");
  const [service, setService] = useState(() => initial?.service ?? "");
  const [error, setError] = useState<string | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const suggestions = useMemo(
    () => filterLocationSuggestions(location),
    [location],
  );

  const query = useMemo(
    () =>
      normalizeSearchQuery({
        location,
        service,
      }),
    [location, service],
  );

  const selectSuggestion = useCallback((suburb: string) => {
    setLocation(suburb);
    setSuggestionsOpen(false);
    setError(null);
  }, []);

  const submit = useCallback(() => {
    if (!isSearchLocationValid(location)) {
      setError(SEARCH_LOCATION_EMPTY_MESSAGE);
      setSuggestionsOpen(true);
      return false;
    }

    if (!isSearchCategoryValid(service)) {
      setError(SEARCH_CATEGORY_EMPTY_MESSAGE);
      return false;
    }

    const path = buildSearchPath(query);
    if (!path) {
      setError(SEARCH_CATEGORY_EMPTY_MESSAGE);
      return false;
    }

    setError(null);
    setSuggestionsOpen(false);
    router.push(path);
    return true;
  }, [location, query, router, service]);

  return {
    location,
    setLocation,
    service,
    setService,
    category: service,
    setCategory: setService,
    query,
    error,
    setError,
    suggestions,
    suggestionsOpen,
    setSuggestionsOpen,
    selectSuggestion,
    submit,
  };
}
