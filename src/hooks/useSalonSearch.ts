"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildCategoryPath,
  buildMarketplaceSearchPath,
  type MarketplaceCategory,
} from "@/features/category";
import type { SearchDistanceKm, SearchSort } from "@/features/search/constants";
import type { SalonSearchOrigin } from "@/features/search/types";
import { parseSearchParams, type SearchQuery } from "@/lib/search";
import type { Salon } from "@/types/salon";

export type SalonSearchStatus = "loading" | "ready" | "error";

type SearchApiResponse = {
  salons?: Salon[];
  total?: number;
  origin?: SalonSearchOrigin | null;
  error?: string | null;
};

export type UseSalonSearchOptions = {
  /** When set, locks service filter + URL to /{category} */
  category?: MarketplaceCategory | null;
};

/**
 * Search-page state: URL ↔ filters ↔ API ↔ results.
 * Presentation components should only consume this hook's outputs.
 */
export function useSalonSearch(options: UseSalonSearchOptions = {}) {
  const { category = null } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(
    () =>
      parseSearchParams(searchParams, {
        service: category?.service ?? "",
      }),
    [searchParams, category?.service],
  );

  const effectiveQuery = useMemo<SearchQuery>(
    () => ({
      ...query,
      service: category?.service ?? query.service,
    }),
    [query, category?.service],
  );

  const [salons, setSalons] = useState<Salon[]>([]);
  const [total, setTotal] = useState(0);
  const [origin, setOrigin] = useState<SalonSearchOrigin | null>(null);
  const [status, setStatus] = useState<SalonSearchStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const pushFilters = useCallback(
    (next: Partial<SearchQuery>) => {
      const merged = {
        location: next.location ?? effectiveQuery.location,
        service: category?.service ?? next.service ?? effectiveQuery.service,
        radiusKm: next.radiusKm ?? effectiveQuery.radiusKm,
        sort: next.sort ?? effectiveQuery.sort,
      };

      const path = category
        ? buildCategoryPath(category.slug, merged)
        : buildMarketplaceSearchPath(merged);

      router.replace(path, { scroll: false });
    },
    [category, effectiveQuery, router],
  );

  const setLocation = useCallback(
    (location: string) => pushFilters({ location }),
    [pushFilters],
  );
  const setService = useCallback(
    (service: string) => {
      if (category) return;
      pushFilters({ service });
    },
    [category, pushFilters],
  );
  const setRadiusKm = useCallback(
    (radiusKm: SearchDistanceKm) => pushFilters({ radiusKm }),
    [pushFilters],
  );
  const setSort = useCallback(
    (sort: SearchSort) => pushFilters({ sort }),
    [pushFilters],
  );

  const retry = useCallback(() => setRetryKey((n) => n + 1), []);

  const clearFilters = useCallback(() => {
    router.replace(category ? `/${category.slug}` : "/search", {
      scroll: false,
    });
  }, [category, router]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      setStatus("loading");
      setError(null);

      const params = new URLSearchParams();
      if (effectiveQuery.location) {
        params.set("location", effectiveQuery.location);
      }
      if (effectiveQuery.service) {
        params.set("service", effectiveQuery.service);
      }
      params.set("radius", String(effectiveQuery.radiusKm));
      params.set("sort", effectiveQuery.sort);

      try {
        const response = await fetch(`/api/search/salons?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json()) as SearchApiResponse;

        if (cancelled) return;

        if (!response.ok || data.error) {
          setSalons([]);
          setTotal(0);
          setOrigin(null);
          setError(data.error || "Failed to search salons");
          setStatus("error");
          return;
        }

        setSalons(data.salons ?? []);
        setTotal(data.total ?? data.salons?.length ?? 0);
        setOrigin(data.origin ?? null);
        setStatus("ready");
      } catch (err) {
        if (
          cancelled ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setSalons([]);
        setTotal(0);
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
    effectiveQuery.location,
    effectiveQuery.service,
    effectiveQuery.radiusKm,
    effectiveQuery.sort,
    retryKey,
  ]);

  return {
    query: effectiveQuery,
    salons,
    total,
    origin,
    status,
    error,
    category,
    setLocation,
    setService,
    setRadiusKm,
    setSort,
    pushFilters,
    retry,
    clearFilters,
  };
}
