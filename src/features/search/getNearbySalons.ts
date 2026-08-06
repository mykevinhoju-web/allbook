import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Salon } from "@/types/salon";

import { SEARCH_PAGE_SIZE } from "./constants";
import { searchSalons, type SearchSalonsResult } from "./searchSalons";
import type { SalonSearchFiltersInput } from "./types";

type AnySupabase = SupabaseClient<Database>;

export type NearbySalonsInput = {
  lat: number;
  lng: number;
  /** Category / primary service label, e.g. "Hair" */
  service?: string;
  radiusKm?: number;
  page?: number;
  pageSize?: number;
  suburb?: string | null;
  minRating?: number | null;
  verifiedOnly?: boolean;
  openNow?: boolean;
};

/**
 * Nearby salon search around a known lat/lng (no geocode step).
 * Reusable across Hair, Day Spa, Nails, Barber, Massage, …
 */
export async function getNearbySalons(
  supabase: AnySupabase,
  input: NearbySalonsInput,
): Promise<SearchSalonsResult> {
  const filters: SalonSearchFiltersInput = {
    service: input.service ?? "",
    radiusKm: input.radiusKm,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? SEARCH_PAGE_SIZE,
    suburb: input.suburb,
    minRating: input.minRating,
    verifiedOnly: input.verifiedOnly,
    openNow: input.openNow,
    sort: "distance",
    /** Synthetic location so searchSalons keeps radius path; origin overridden below */
    location: "",
  };

  const result = await searchSalons(supabase, filters, {
    originOverride: {
      lat: input.lat,
      lng: input.lng,
    },
  });

  return result;
}

export type { Salon };
