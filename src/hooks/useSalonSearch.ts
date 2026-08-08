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
import { saveSearchLocation } from "@/lib/search-location-preference";
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
  const skipNextFetch = useRef(Boolean(initialResult && !initialResult.error));
  /** Ignore stale responses when the user searches again quickly. */
  const fetchGeneration = useRef(0);

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

      if (location) params.set("location", location.toLowerCase());
      if (lat != null && lng != null) {
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
      if (typeof value === "string") {
        pushState({ location: value, clearCoords: true, page: 1 });
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
          page: 1,
        });
        return;
      }
      pushState({
        location: value.location,
        clearCoords: true,
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

    let cancelled = false;
    const controller = new AbortController();
    const generation = ++fetchGeneration.current;

    async function run() {
      // Drop previous pins immediately so the map never shows a mixed set.
      setStatus("loading");
      setError(null);
      setSalons([]);
      setTotal(0);
      setHasMore(false);
      setOrigin(null);

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

        if (cancelled || generation !== fetchGeneration.current) return;

        if (!response.ok || data.error) {
          setSalons([]);
          setTotal(0);
          setHasMore(false);
          setOrigin(null);
          setError(data.error || "Failed to search salons");
          setStatus("error");
          return;
        }

        setSalons(data.salons ?? []);
        setTotal(data.total ?? data.salons?.length ?? 0);
        setHasMore(Boolean(data.hasMore));
        setPageSize(data.pageSize ?? 20);
        setOrigin(data.origin ?? null);
        setStatus("ready");
      } catch (err) {
        if (
          cancelled ||
          generation !== fetchGeneration.current ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setSalons([]);
        setTotal(0);
        setHasMore(false);
        setOrigin(null);
        setError(err instanceof Error ? err.message : "Failed to search salons");
        setStatus("error");
      }
    }

    void run();
    return () => {
      cancelled = true;
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

  return {
    query: effectiveQuery,
    filters,
    salons,
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
