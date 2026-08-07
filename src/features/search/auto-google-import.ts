import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildTextQuery,
  resolvePlacesCategoryMapping,
} from "@/features/google-import/category-map";
import { mapPlaceToSnapshot } from "@/features/google-import/map-place";
import {
  searchTextPlaces,
  sleep,
} from "@/features/google-import/places-client";
import { upsertGoogleSalon } from "@/features/google-import/upsert-google-salon";
import type { Database } from "@/types/database";

type AnySupabase = SupabaseClient<Database>;

/** Re-query Google for an area after this many days. */
export const SEARCH_AREA_STALE_DAYS = 7;

/** If fewer than this many real local results, treat area as under-populated. */
export const SEARCH_AREA_MIN_LOCAL = 5;

/** Max Places Text Search pages per search-triggered fill (each ≤20). */
const SEARCH_FILL_MAX_PAGES = 2;

export type SearchGoogleFillInput = {
  category: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
};

export type SearchGoogleFillResult = {
  areaKey: string;
  queried: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  status: "ok" | "failed" | "partial" | "skipped";
  error?: string;
};

function roundCoord(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function buildSearchAreaKey(input: {
  categorySlug: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}): string {
  return [
    input.categorySlug,
    roundCoord(input.latitude),
    roundCoord(input.longitude),
    Math.round(input.radiusKm),
  ].join(":");
}

export async function getSearchAreaCoverage(
  supabase: AnySupabase,
  areaKey: string,
): Promise<{ lastFetchedAt: string | null; lastStatus: string } | null> {
  const { data } = await supabase
    .from("search_area_coverage")
    .select("last_fetched_at, last_status")
    .eq("area_key", areaKey)
    .maybeSingle();

  if (!data) return null;
  return {
    lastFetchedAt: data.last_fetched_at,
    lastStatus: data.last_status,
  };
}

export function isSearchAreaStale(
  lastFetchedAt: string | null | undefined,
  staleDays = SEARCH_AREA_STALE_DAYS,
): boolean {
  if (!lastFetchedAt) return true;
  const ageMs = Date.now() - new Date(lastFetchedAt).getTime();
  return ageMs > staleDays * 24 * 60 * 60 * 1000;
}

/**
 * Whether this search should trigger a Google Places fill.
 * Local DB is always queried first by the caller.
 */
export function shouldFillFromGoogle(input: {
  localCount: number;
  lastFetchedAt: string | null | undefined;
  hasOrigin: boolean;
  hasCategory: boolean;
}): boolean {
  if (!input.hasOrigin || !input.hasCategory) return false;
  if (input.localCount < SEARCH_AREA_MIN_LOCAL) return true;
  return isSearchAreaStale(input.lastFetchedAt);
}

/**
 * Import Google Places for a search origin into local `salons`.
 * Upserts by google_place_id — never creates duplicates.
 * Does not import synthetic/demo data (Google live Places only).
 */
export async function fillSearchAreaFromGoogle(
  supabase: AnySupabase,
  input: SearchGoogleFillInput,
): Promise<SearchGoogleFillResult> {
  let mapping;
  try {
    mapping = resolvePlacesCategoryMapping(input.category);
  } catch (error) {
    return {
      areaKey: "",
      queried: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      status: "skipped",
      error: error instanceof Error ? error.message : "Unsupported category",
    };
  }

  const areaKey = buildSearchAreaKey({
    categorySlug: mapping.categorySlug,
    latitude: input.latitude,
    longitude: input.longitude,
    radiusKm: input.radiusKm,
  });

  const result: SearchGoogleFillResult = {
    areaKey,
    queried: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    status: "ok",
  };

  try {
    const locationName =
      input.locationLabel.split(",")[0]?.trim() || input.locationLabel;
    const textQuery = buildTextQuery({
      textNoun: mapping.textNoun,
      city: locationName,
      state: "Australia",
      country: "Australia",
    });

    const radiusMeters = Math.min(
      50_000,
      Math.max(2_000, input.radiusKm * 1000),
    );

    const seen = new Set<string>();
    let pageToken: string | null = null;

    for (let page = 0; page < SEARCH_FILL_MAX_PAGES; page += 1) {
      const response = await searchTextPlaces({
        textQuery,
        includedType: mapping.includedType,
        pageSize: 20,
        pageToken,
        regionCode: "AU",
        locationBias: {
          center: { lat: input.latitude, lng: input.longitude },
          radiusMeters,
        },
      });

      for (const place of response.places) {
        const snapshot = mapPlaceToSnapshot(
          place,
          mapping,
          {
            city: locationName,
            state: "Australia",
            country: "Australia",
          },
          4,
        );
        if (!snapshot || seen.has(snapshot.placeId)) {
          result.skipped += 1;
          continue;
        }
        seen.add(snapshot.placeId);
        result.queried += 1;

        const upsert = await upsertGoogleSalon(supabase, snapshot);
        if (upsert.action === "inserted") result.imported += 1;
        else if (upsert.action === "updated") result.updated += 1;
        else if (upsert.action === "failed") {
          result.failed += 1;
        } else {
          result.skipped += 1;
        }
      }

      pageToken = response.nextPageToken;
      if (!pageToken) break;
      await sleep(300);
    }

    if (result.failed > 0 && result.imported + result.updated === 0) {
      result.status = "failed";
    } else if (result.failed > 0) {
      result.status = "partial";
    }

    const now = new Date().toISOString();
    await supabase.from("search_area_coverage").upsert(
      {
        area_key: areaKey,
        category_slug: mapping.categorySlug,
        location_label: input.locationLabel,
        latitude: input.latitude,
        longitude: input.longitude,
        radius_km: input.radiusKm,
        last_fetched_at: now,
        last_status: result.status === "failed" ? "failed" : "ok",
        imported_count: result.imported,
        updated_count: result.updated,
        skipped_count: result.skipped,
        failed_count: result.failed,
        error_message: result.error ?? null,
        updated_at: now,
      },
      { onConflict: "area_key" },
    );

    await supabase.from("search_google_import_runs").insert({
      area_key: areaKey,
      category_slug: mapping.categorySlug,
      location_label: input.locationLabel,
      latitude: input.latitude,
      longitude: input.longitude,
      radius_km: input.radiusKm,
      queried: result.queried,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
      status: result.status === "skipped" ? "ok" : result.status,
      error_message: result.error ?? null,
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google search fill failed";
    result.status = "failed";
    result.error = message;

    const now = new Date().toISOString();
    await supabase.from("search_area_coverage").upsert(
      {
        area_key: areaKey,
        category_slug: mapping.categorySlug,
        location_label: input.locationLabel,
        latitude: input.latitude,
        longitude: input.longitude,
        radius_km: input.radiusKm,
        last_fetched_at: now,
        last_status: "failed",
        imported_count: result.imported,
        updated_count: result.updated,
        skipped_count: result.skipped,
        failed_count: result.failed,
        error_message: message,
        updated_at: now,
      },
      { onConflict: "area_key" },
    );

    await supabase.from("search_google_import_runs").insert({
      area_key: areaKey,
      category_slug: mapping.categorySlug,
      location_label: input.locationLabel,
      latitude: input.latitude,
      longitude: input.longitude,
      radius_km: input.radiusKm,
      queried: result.queried,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
      status: "failed",
      error_message: message,
    });

    return result;
  }
}

/** Map marketplace service label → Places import category slug. */
export function serviceToImportCategory(service: string): string | null {
  const key = service.trim().toLowerCase();
  if (!key) return null;
  if (key.includes("hair") || key.includes("barber")) return "hair";
  if (key.includes("nail")) return "nails";
  if (key.includes("spa")) return "spa";
  if (key.includes("massage")) return "massage";
  if (key.includes("facial")) return "facial";
  if (key.includes("wax")) return "waxing";
  if (key.includes("brow") || key.includes("lash")) return "facial";
  try {
    return resolvePlacesCategoryMapping(key).categorySlug;
  } catch {
    return null;
  }
}
