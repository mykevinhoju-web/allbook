"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  SEARCH_LOCATION_EMPTY_MESSAGE,
  buildSearchPath,
  filterLocationSuggestions,
  isSearchLocationValid,
  type SearchQuery,
} from "@/lib/search";

export type UseSearchOptions = {
  /** Seed values (landing hero or URL-hydrated search page). */
  initial?: Partial<SearchQuery>;
};

/**
 * Reusable search state for landing → /search (and later Maps / Supabase).
 * Does not read the URL itself — pass `initial` from `parseSearchParams` when needed.
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

  const query = useMemo<SearchQuery>(
    () => ({ location: location.trim(), service: service.trim() }),
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

    setError(null);
    setSuggestionsOpen(false);
    router.push(buildSearchPath(query));
    return true;
  }, [location, query, router]);

  return {
    location,
    setLocation,
    service,
    setService,
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
