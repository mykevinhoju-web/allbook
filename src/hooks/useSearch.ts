"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import {
  readSavedSearchLocation,
  saveSearchLocation,
} from "@/lib/search-location-preference";

import { useDeviceLocation } from "./useDeviceLocation";

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
  const deviceLocation = useDeviceLocation();

  const [location, setLocation] = useState(() => initial?.location ?? "");
  const [service, setService] = useState(() => initial?.service ?? "");
  const [lat, setLat] = useState<number | null>(() => initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(() => initial?.lng ?? null);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [hydratedSaved, setHydratedSaved] = useState(false);

  // Restore last saved device location once (landing only when empty).
  useEffect(() => {
    if (hydratedSaved) return;
    setHydratedSaved(true);
    if ((initial?.location ?? "").trim()) return;
    const saved = readSavedSearchLocation();
    if (!saved) return;
    setLocation(saved.label);
    setLat(saved.lat);
    setLng(saved.lng);
  }, [hydratedSaved, initial?.location]);

  const suggestions = useMemo(
    () => filterLocationSuggestions(location),
    [location],
  );

  const query = useMemo(
    () =>
      normalizeSearchQuery({
        location,
        service,
        lat,
        lng,
      }),
    [location, service, lat, lng],
  );

  const setLocationText = useCallback((value: string) => {
    setLocation(value);
    // Typing a suburb manually invalidates precise GPS coords.
    setLat(null);
    setLng(null);
  }, []);

  const selectSuggestion = useCallback((suburb: string) => {
    setLocation(suburb);
    setLat(null);
    setLng(null);
    setSuggestionsOpen(false);
    setError(null);
  }, []);

  const useNearMe = useCallback(async () => {
    const result = await deviceLocation.requestLocation();
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setLocation(result.location.label);
    setLat(result.location.lat);
    setLng(result.location.lng);
    setSuggestionsOpen(false);
    setError(null);
    return true;
  }, [deviceLocation]);

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

    if (lat != null && lng != null) {
      saveSearchLocation({ label: location.trim(), lat, lng });
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
  }, [location, query, router, service, lat, lng]);

  return {
    location,
    setLocation: setLocationText,
    service,
    setService,
    category: service,
    setCategory: setService,
    lat,
    lng,
    query,
    error: error || (deviceLocation.status !== "locating" ? deviceLocation.error : null),
    setError,
    suggestions,
    suggestionsOpen,
    setSuggestionsOpen,
    selectSuggestion,
    useNearMe,
    isLocating: deviceLocation.isLocating,
    submit,
  };
}
