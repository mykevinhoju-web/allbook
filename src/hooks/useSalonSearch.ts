"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type MarketplaceCategory,
} from "@/features/category";
import type { SearchSalonsResult } from "@/features/search";
import {
  DEFAULT_SEARCH_DISTANCE_KM,
  type SearchDistanceKm,
  type SearchSort,
} from "@/features/search/constants";
import type { SalonSearchOrigin } from "@/features/search/types";
import { parseSearchParams, type SearchQuery } from "@/lib/search";
import {
  clearSavedSearchLocation,
  saveSearchLocation,
} from "@/lib/search-location-preference";
import type { Salon } from "@/types/salon";

export type SalonSearchStatus = "loading" | "ready" | "error";

type SearchApiResponse = SearchSalonsResult;

export type UseSalonSearchOptions = {
  category: MarketplaceCategory;
  initialResult?: SearchSalonsResult | null;
};

export type SalonSearchUiFilters = {
  suburb: string;
  minRating: number | null;
  verifiedOnly: boolean;
  openNow: boolean;
};

const SEARCH_FETCH_TIMEOUT_MS = 20_000;
const EMPTY_IMPORT_RETRY_MS = 2_500;

/**
 * Category search state: URL ↔ filters ↔ API ↔ results.
 */
export function useSalonSearch(options: UseSalonSearchOptions) {
  const { category, initialResult = null } = options;
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = useMemo(
    () =>
      parseSearchParams(searchParams, {
        service: category.service,
      }),
    [searchParams, category.service],
  );

  const filters = useMemo<SalonSearchUiFilters>(() => {
    const suburb = (searchParams.get("suburb") ?? "").trim();
    const minRaw = Number(searchParams.get("rating"));
    const minRating =
      Number.isFinite(minRaw) && minRaw > 0 ? Math.min(5, minRaw) : null;
    const verifiedOnly =
      searchParams.get("verified") === "1" ||
      searchParams.get("verified") === "true";
    const openNow =
      searchParams.get("open") === "1" || searchParams.get("open") === "true";
    return { suburb, minRating, verifiedOnly, openNow };
  }, [searchParams]);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const effectiveQuery = useMemo<SearchQuery>(
    () => ({
      ...query,
      service: category.service,
    }),
    [query, category.service],
  );

  const [salons, setSalons] = useState<Salon[]>(
    () => initialResult?.salons ?? [],
  );
  const [mapSalons, setMapSalons] = useState<Salon[]>(
    () => initialResult?.mapSalons ?? initialResult?.salons ?? [],
  );
  const [total, setTotal] = useState(() => initialResult?.total ?? 0);
  const [hasMore, setHasMore] = useState(
    () => initialResult?.hasMore ?? false,
  );
  const [pageSize, setPageSize] = useState(
    () => initialResult?.pageSize ?? 20,
  );
  const [origin, setOrigin] = useState<SalonSearchOrigin | null>(
    () => initialResult?.origin ?? null,
  );
  const [status, setStatus] = useState<SalonSearchStatus>(() =>
    initialResult && !initialResult.error ? "ready" : "loading",
  );
  const [error, setError] = useState<string | null>(
    () => initialResult?.error ?? null,
  );
  const [retryKey, setRetryKey] = useState(0);
  // Only skip the first client fetch when SSR already returned rows.
  // Empty SSR (first-fill / geocode miss) must still refetch on the client.
  const skipNextFetch = useRef(
    Boolean(
      initialResult &&
        !initialResult.error &&
        (initialResult.salons?.length ?? 0) > 0,
    ),
  );
  /** Ignore stale responses when the user searches again quickly. */
  const fetchGeneration = useRef(0);
  const emptyRetryDoneFor = useRef<string | null>(null);

  const pushState = useCallback(
    (next: {
      location?: string;
      lat?: number | null;
      lng?: number | null;
      clearCoords?: boolean;
      suburb?: string;
      minRating?: number | null;
      verifiedOnly?: boolean;
      openNow?: boolean;
      radiusKm?: SearchDistanceKm;
      sort?: SearchSort;
      page?: number;
    }) => {
      const params = new URLSearchParams();
      const location = next.location ?? effectiveQuery.location;
      const suburb = next.suburb ?? filters.suburb;
      const minRating =
        next.minRating !== undefined ? next.minRating : filters.minRating;
      const verifiedOnly =
        next.verifiedOnly !== undefined
          ? next.verifiedOnly
          : filters.verifiedOnly;
      const openNow =
        next.openNow !== undefined ? next.openNow : filters.openNow;
      const radiusKm = next.radiusKm ?? effectiveQuery.radiusKm;
      const sort = next.sort ?? effectiveQuery.sort;
      const nextPage = next.page ?? 1;
      const lat = next.clearCoords
        ? null
        : next.lat !== undefined
          ? next.lat
          : effectiveQuery.lat;
      const lng = next.clearCoords
        ? null
        : next.lng !== undefined
          ? next.lng
          : effectiveQuery.lng;

      if (location.trim()) {
        params.set("location", location.trim().toLowerCase());
      }
      if (
        lat != null &&
        lng != null &&
        !(lat === 0 && lng === 0)
      ) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
      }
      if (suburb) params.set("suburb", suburb);
      if (minRating != null && minRating > 0) {
        params.set("rating", String(minRating));
      }
      if (verifiedOnly) params.set("verified", "1");
      if (openNow) params.set("open", "1");
      if (radiusKm !== DEFAULT_SEARCH_DISTANCE_KM) {
        params.set("radius", String(radiusKm));
      }
      if (sort !== "distance") params.set("sort", sort);
      if (nextPage > 1) params.set("page", String(nextPage));

      const qs = params.toString();
      router.replace(`/${category.slug}${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [category.slug, effectiveQuery, filters, router],
  );

  const setLocation = useCallback(
    (
      value:
        | string
        | { location: string; lat?: number | null; lng?: number | null },
    ) => {
      // Location is owned by the top SearchBar — drop the old suburb filter so
      // results never show a mismatched second place name.
      if (typeof value === "string") {
        clearSavedSearchLocation();
        pushState({
          location: value,
          clearCoords: true,
          suburb: "",
          page: 1,
        });
        return;
      }
      if (value.lat != null && value.lng != null) {
        saveSearchLocation({
          label: value.location,
          lat: value.lat,
          lng: value.lng,
        });
        pushState({
          location: value.location,
          lat: value.lat,
          lng: value.lng,
          suburb: "",
          page: 1,
        });
        return;
      }
      pushState({
        location: value.location,
        clearCoords: true,
        suburb: "",
        page: 1,
      });
    },
    [pushState],
  );

  const setFilters = useCallback(
    (partial: Partial<SalonSearchUiFilters>) =>
      pushState({ ...partial, page: 1 }),
    [pushState],
  );

  const setPage = useCallback(
    (nextPage: number) => pushState({ page: nextPage }),
    [pushState],
  );

  const setRadiusKm = useCallback(
    (radiusKm: SearchDistanceKm) => pushState({ radiusKm, page: 1 }),
    [pushState],
  );

  const setSort = useCallback(
    (sort: SearchSort) => pushState({ sort, page: 1 }),
    [pushState],
  );

  const retry = useCallback(() => setRetryKey((n) => n + 1), []);

  const clearFilters = useCallback(() => {
    router.replace(`/${category.slug}`, { scroll: false });
  }, [category.slug, router]);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    const controller = new AbortController();
    const generation = ++fetchGeneration.current;
    let settled = false;
    let timedOut = false;

    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, SEARCH_FETCH_TIMEOUT_MS);

    const isCurrent = () => generation === fetchGeneration.current;

    async function run() {
      setStatus("loading");
      setError(null);
      setSalons([]);
      // Keep previous map pins until the new payload arrives (avoids flicker on paging).

      const params = new URLSearchParams();
      if (effectiveQuery.location) {
        params.set("location", effectiveQuery.location);
      }
      if (effectiveQuery.lat != null && effectiveQuery.lng != null) {
        params.set("lat", String(effectiveQuery.lat));
        params.set("lng", String(effectiveQuery.lng));
      }
      params.set("service", category.service);
      params.set("radius", String(effectiveQuery.radiusKm));
      params.set("sort", effectiveQuery.sort);
      params.set("page", String(page));
      if (filters.suburb) params.set("suburb", filters.suburb);
      if (filters.minRating != null) {
        params.set("rating", String(filters.minRating));
      }
      if (filters.verifiedOnly) params.set("verified", "1");
      if (filters.openNow) params.set("open", "1");

      try {
        const response = await fetch(`/api/search/salons?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json()) as SearchApiResponse;

        if (!isCurrent()) return;
        settled = true;

        if (!response.ok || data.error) {
          setSalons([]);
          setMapSalons([]);
          setTotal(0);
          setHasMore(false);
          setOrigin(null);
          setError(data.error || "Failed to search salons");
          setStatus("error");
          return;
        }

        setSalons(data.salons ?? []);
        setMapSalons(data.mapSalons ?? data.salons ?? []);
        setTotal(data.total ?? data.salons?.length ?? 0);
        setHasMore(Boolean(data.hasMore));
        setPageSize(data.pageSize ?? 20);
        setOrigin(data.origin ?? null);
        setStatus("ready");
      } catch (err) {
        if (!isCurrent()) return;
        settled = true;

        const aborted =
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "AbortError");

        if (aborted) {
          if (timedOut) {
            setSalons([]);
            setMapSalons([]);
            setTotal(0);
            setHasMore(false);
            setOrigin(null);
            setError("Search timed out. Please try again.");
            setStatus("error");
          }
          // Cleanup abort (superseded by a newer search) — leave state to the new run.
          return;
        }

        setSalons([]);
        setMapSalons([]);
        setTotal(0);
        setHasMore(false);
        setOrigin(null);
        setError(err instanceof Error ? err.message : "Failed to search salons");
        setStatus("error");
      } finally {
        window.clearTimeout(timeoutId);
        // Safety: if this generation somehow exits without settling, don't stick on loading.
        if (isCurrent() && !settled && timedOut) {
          setStatus("error");
          setError("Search timed out. Please try again.");
        }
      }
    }

    void run();
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    category.service,
    effectiveQuery.location,
    effectiveQuery.lat,
    effectiveQuery.lng,
    effectiveQuery.radiusKm,
    effectiveQuery.sort,
    filters.suburb,
    filters.minRating,
    filters.verifiedOnly,
    filters.openNow,
    page,
    retryKey,
  ]);

  // Background Google fill may populate an empty first page shortly after search.
  useEffect(() => {
    if (status !== "ready") return;
    if (salons.length > 0) return;
    if (page !== 1) return;

    const hasOrigin =
      (effectiveQuery.lat != null && effectiveQuery.lng != null) ||
      Boolean(effectiveQuery.location.trim());
    if (!hasOrigin) return;

    const key = [
      category.service,
      effectiveQuery.location,
      effectiveQuery.lat ?? "",
      effectiveQuery.lng ?? "",
      effectiveQuery.radiusKm,
    ].join("|");

    if (emptyRetryDoneFor.current === key) return;
    emptyRetryDoneFor.current = key;

    const timer = window.setTimeout(() => {
      setRetryKey((n) => n + 1);
    }, EMPTY_IMPORT_RETRY_MS);

    return () => window.clearTimeout(timer);
  }, [
    status,
    salons.length,
    page,
    category.service,
    effectiveQuery.location,
    effectiveQuery.lat,
    effectiveQuery.lng,
    effectiveQuery.radiusKm,
  ]);

  return {
    query: effectiveQuery,
    filters,
    salons,
    mapSalons,
    total,
    page,
    pageSize,
    hasMore,
    origin,
    status,
    error,
    category,
    setLocation,
    setFilters,
    setPage,
    setRadiusKm,
    setSort,
    retry,
    clearFilters,
  };
}
