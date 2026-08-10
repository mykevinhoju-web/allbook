import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { mapSalonRow } from "@/features/salon/getSalons";
import { parseOpeningHours } from "@/features/salon/map-salon-detail";
import { createServiceSupabase } from "@/lib/supabase/service";
import type { Database } from "@/types/database";
import type { OpeningHours, Salon, SalonRow } from "@/types/salon";

import {
  buildSearchAreaKey,
  fillSearchAreaFromGoogle,
  getSearchAreaCoverage,
  serviceToImportCategory,
  shouldFillFromGoogle,
} from "./auto-google-import";
import { resolveBrisbaneSuburb } from "./brisbane-suburbs";
import {
  SEARCH_PAGE_SIZE,
  resolveServiceFilterValues,
} from "./constants";
import { geocodeSearchLocation } from "./geocode";
import { isSalonOpenNow } from "./isSalonOpenNow";
import {
  normalizeSalonSearchFilters,
  type SalonSearchFilters,
  type SalonSearchFiltersInput,
  type SalonSearchOrigin,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

type SearchRpcRow = SalonRow & {
  distance_km: number | null;
};

/** Max salons loaded for accurate total + map pins within a radius. */
const SEARCH_RADIUS_RESULT_CAP = 300;

export type SearchSalonsResult = {
  /** Current list page (nearest-first slice). */
  salons: Salon[];
  /** Every match inside the radius (capped) — used for map pins + stable total. */
  mapSalons: Salon[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  origin: SalonSearchOrigin | null;
  filters: SalonSearchFilters;
  error: string | null;
};

export type SearchSalonsOptions = {
  /** Skip geocode and use this origin (for getNearbySalons). */
  originOverride?: SalonSearchOrigin | null;
  /** Disable search-time Google fill (tests / admin). */
  skipGoogleFill?: boolean;
};

/**
 * Marketplace search engine (Supabase RPC + post-filters).
 * 1) Always search local DB first (returns Salon rows only).
 * 2) If area missing/stale, fill from Google Places (background preferred).
 * 3) Never return raw Google objects to the UI.
 */
export async function searchSalons(
  supabase: AnySupabase,
  rawFilters: SalonSearchFiltersInput = {},
  options: SearchSalonsOptions = {},
): Promise<SearchSalonsResult> {
  const filters = normalizeSalonSearchFilters(rawFilters);
  const page = filters.page;
  const pageSize = filters.pageSize ?? SEARCH_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let origin: SalonSearchOrigin | null = options.originOverride ?? null;

  if (
    !origin &&
    filters.latitude != null &&
    filters.longitude != null
  ) {
    origin = {
      lat: filters.latitude,
      lng: filters.longitude,
      formattedAddress: filters.location || undefined,
    };
  }

  // Known Brisbane suburbs (Albion, etc.) — use catalogue coords first so
  // search never depends on a flaky/missing Geocoding round-trip.
  if (!origin && filters.location) {
    const known = resolveBrisbaneSuburb(filters.location);
    if (known) {
      origin = {
        lat: known.latitude,
        lng: known.longitude,
        formattedAddress: `${known.name} QLD ${known.postcode}, Australia`,
      };
    }
  }

  if (!origin && filters.location) {
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
      return emptyResult(
        filters,
        null,
        err instanceof Error
          ? err.message
          : "Failed to geocode search location",
      );
    }
  }

  const result = await runLocalSearch(supabase, filters, origin, {
    page,
    pageSize,
    offset,
  });

  if (options.skipGoogleFill) {
    return result;
  }

  const category = serviceToImportCategory(filters.service);
  const locationLabel =
    origin?.formattedAddress || filters.location || filters.suburb;

  if (origin && category && locationLabel) {
    const areaKey = buildSearchAreaKey({
      categorySlug: category,
      latitude: origin.lat,
      longitude: origin.lng,
      radiusKm: filters.radiusKm,
    });

    const service = createServiceSupabase();
    const coverage = await getSearchAreaCoverage(service, areaKey);
    const needsFill = shouldFillFromGoogle({
      localCount: result.total,
      lastFetchedAt: coverage?.lastFetchedAt,
      lastStatus: coverage?.lastStatus,
      hasResumeToken: Boolean(coverage?.resumePageToken),
      hasOrigin: true,
      hasCategory: true,
    });

    if (needsFill) {
      const fillInput = {
        category,
        locationLabel,
        latitude: origin.lat,
        longitude: origin.lng,
        radiusKm: filters.radiusKm,
      };

      // Empty areas: await fill once so Paddington / sparse suburbs are not blank
      // on first visit. Already-populated areas keep background refresh only.
      if (result.total === 0) {
        await fillSearchAreaFromGoogle(service, fillInput);
        return runLocalSearch(supabase, filters, origin, {
          page,
          pageSize,
          offset,
        });
      }

      after(() => {
        void fillSearchAreaFromGoogle(service, fillInput);
      });
    }
  }

  return result;
}

async function runLocalSearch(
  supabase: AnySupabase,
  filters: SalonSearchFilters,
  origin: SalonSearchOrigin | null,
  paging: { page: number; pageSize: number; offset: number },
): Promise<SearchSalonsResult> {
  const { page, pageSize, offset } = paging;
  const services = resolveServiceFilterValues(filters.service);

  const suburbFilter = filters.suburb
    ? filters.suburb.replace(/[%_,]/g, "")
    : origin || !filters.location
      ? null
      : filters.location.replace(/[%_,]/g, "");

  // Load the full in-radius set (capped) so total + map stay stable across pages.
  const { data, error } = await supabase.rpc("search_marketplace_salons", {
    p_lat: origin?.lat ?? null,
    p_lng: origin?.lng ?? null,
    p_radius_km: origin ? filters.radiusKm : null,
    p_service: null,
    p_services: services,
    p_suburb: suburbFilter,
    p_sort: filters.sort,
    p_limit: SEARCH_RADIUS_RESULT_CAP,
    p_offset: 0,
  });

  if (error) {
    return emptyResult(filters, origin, error.message);
  }

  const rows = (data ?? []) as SearchRpcRow[];
  let salons = rows.map((row) => {
    const salon = mapSalonRow(row);
    return {
      ...salon,
      distanceKm:
        row.distance_km == null ? undefined : Number(row.distance_km),
      isOpen: undefined as boolean | undefined,
    };
  });

  if (filters.verifiedOnly) {
    salons = salons.filter((s) => s.verified);
  }

  if (filters.minRating != null && filters.minRating > 0) {
    const min = filters.minRating;
    salons = salons.filter((s) => s.rating >= min);
  }

  if (filters.openNow && salons.length > 0) {
    const hoursById = await loadOpeningHours(
      supabase,
      salons.map((s) => s.id),
    );
    salons = salons
      .map((salon) => {
        const hours = hoursById.get(salon.id);
        const isOpen = isSalonOpenNow(hours);
        return { ...salon, isOpen };
      })
      .filter((salon) => salon.isOpen);
  } else if (salons.length > 0) {
    // Opening hours only needed for the visible list page (+ a small buffer).
    const hoursSlice = salons.slice(offset, offset + pageSize);
    const hoursById = await loadOpeningHours(
      supabase,
      hoursSlice.map((s) => s.id),
    );
    salons = salons.map((salon) => ({
      ...salon,
      isOpen: hoursById.has(salon.id)
        ? isSalonOpenNow(hoursById.get(salon.id))
        : undefined,
    }));
  }

  const total = salons.length;
  const inRadius =
    origin == null
      ? salons
      : salons.filter(
          (s) =>
            s.distanceKm == null ||
            (Number.isFinite(s.distanceKm) &&
              s.distanceKm <= filters.radiusKm),
        );
  const pageRows = inRadius.slice(offset, offset + pageSize);
  const hasMore = offset + pageSize < inRadius.length;

  return {
    salons: pageRows,
    mapSalons: inRadius,
    total: inRadius.length,
    page,
    pageSize,
    hasMore,
    origin,
    filters,
    error: null,
  };
}

async function loadOpeningHours(
  supabase: AnySupabase,
  ids: string[],
): Promise<Map<string, OpeningHours>> {
  const unique = [...new Set(ids)].filter(Boolean);
  const map = new Map<string, OpeningHours>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from("salons")
    .select("id, opening_hours")
    .in("id", unique);

  if (error || !data) return map;

  for (const row of data) {
    map.set(row.id, parseOpeningHours(row.opening_hours));
  }
  return map;
}

function emptyResult(
  filters: SalonSearchFilters,
  origin: SalonSearchOrigin | null,
  error: string,
): SearchSalonsResult {
  return {
    salons: [],
    mapSalons: [],
    total: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    hasMore: false,
    origin,
    filters,
    error,
  };
}
