"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { SearchDistanceKm, SearchSort } from "@/features/search/constants";
import type { SalonSearchOrigin } from "@/features/search/types";
import {
  buildSearchPath,
  parseSearchParams,
  type SearchQuery,
} from "@/lib/search";
import type { Salon } from "@/types/salon";

export type SalonSearchStatus = "loading" | "ready" | "error";

type SearchApiResponse = {
  salons?: Salon[];
  total?: number;
  origin?: SalonSearchOrigin | null;
  error?: string | null;
};

/**
 * Search-page state: URL ↔ filters ↔ API ↔ results.
 * Presentation components should only consume this hook's outputs.
 */
export function useSalonSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );

  const [salons, setSalons] = useState<Salon[]>([]);
  const [total, setTotal] = useState(0);
  const [origin, setOrigin] = useState<SalonSearchOrigin | null>(null);
  const [status, setStatus] = useState<SalonSearchStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const pushFilters = useCallback(
    (next: Partial<SearchQuery>) => {
      router.replace(
        buildSearchPath({
          location: next.location ?? query.location,
          service: next.service ?? query.service,
          radiusKm: next.radiusKm ?? query.radiusKm,
          sort: next.sort ?? query.sort,
        }),
        { scroll: false },
      );
    },
    [query, router],
  );

  const setLocation = useCallback(
    (location: string) => pushFilters({ location }),
    [pushFilters],
  );
  const setService = useCallback(
    (service: string) => pushFilters({ service }),
    [pushFilters],
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
    router.replace("/search", { scroll: false });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      setStatus("loading");
      setError(null);

      const params = new URLSearchParams();
      if (query.location) params.set("location", query.location);
      if (query.service) params.set("service", query.service);
      params.set("radius", String(query.radiusKm));
      params.set("sort", query.sort);

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
    query.location,
    query.service,
    query.radiusKm,
    query.sort,
    retryKey,
  ]);

  return {
    query,
    salons,
    total,
    origin,
    status,
    error,
    setLocation,
    setService,
    setRadiusKm,
    setSort,
    pushFilters,
    retry,
    clearFilters,
  };
}
