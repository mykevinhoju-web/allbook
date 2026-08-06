import type { SupabaseClient } from "@supabase/supabase-js";

import { mapSalonRow } from "@/features/salon/getSalons";
import type { Database } from "@/types/database";
import type { Salon, SalonRow } from "@/types/salon";

import {
  SEARCH_PAGE_SIZE,
  resolveServiceFilterValues,
} from "./constants";
import { geocodeSearchLocation } from "./geocode";
import {
  normalizeSalonSearchFilters,
  type SalonSearchFilters,
  type SalonSearchOrigin,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

type SearchRpcRow = SalonRow & {
  distance_km: number | null;
};

export type SearchSalonsResult = {
  salons: Salon[];
  total: number;
  origin: SalonSearchOrigin | null;
  filters: SalonSearchFilters;
  error: string | null;
};

/**
 * Marketplace search engine.
 * Geocodes location → queries Supabase RPC (bbox + haversine) → sorted results.
 */
export async function searchSalons(
  supabase: AnySupabase,
  rawFilters: Partial<SalonSearchFilters> = {},
): Promise<SearchSalonsResult> {
  const filters = normalizeSalonSearchFilters(rawFilters);
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? SEARCH_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let origin: SalonSearchOrigin | null = null;

  if (filters.location) {
    try {
      const geocoded = await geocodeSearchLocation(filters.location);
      if (geocoded) {
        origin = {
          lat: geocoded.center.lat,
          lng: geocoded.center.lng,
          formattedAddress: geocoded.formattedAddress,
        };
      }
    } catch (err) {
      return {
        salons: [],
        total: 0,
        origin: null,
        filters,
        error:
          err instanceof Error
            ? err.message
            : "Failed to geocode search location",
      };
    }
  }

  const services = resolveServiceFilterValues(filters.service);

  // When we have an origin, prefer radius search and skip loose suburb text match
  // so nearby salons in adjacent suburbs still appear.
  const suburbFilter =
    origin || !filters.location ? null : filters.location.replace(/[%_,]/g, "");

  const { data, error } = await supabase.rpc("search_marketplace_salons", {
    p_lat: origin?.lat ?? null,
    p_lng: origin?.lng ?? null,
    p_radius_km: origin ? filters.radiusKm : null,
    p_service: null,
    p_services: services,
    p_suburb: suburbFilter,
    p_sort: filters.sort,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    return {
      salons: [],
      total: 0,
      origin,
      filters,
      error: error.message,
    };
  }

  const rows = (data ?? []) as SearchRpcRow[];
  const salons = rows.map((row) => {
    const salon = mapSalonRow(row);
    return {
      ...salon,
      distanceKm:
        row.distance_km == null ? undefined : Number(row.distance_km),
    };
  });

  return {
    salons,
    total: salons.length,
    origin,
    filters,
    error: null,
  };
}
