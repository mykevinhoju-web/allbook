import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildTextQuery,
  resolvePlacesCategoryMapping,
} from "@/features/google-import/category-map";
import { mapPlaceToSnapshot } from "@/features/google-import/map-place";
import {
  searchTextPlacesWithRetry,
  sleep,
} from "@/features/google-import/places-client";
import { upsertGoogleSalon } from "@/features/google-import/upsert-google-salon";
import type { Database } from "@/types/database";

type AnySupabase = SupabaseClient<Database>;

/** Re-query Google for an area after this many days. */
export const SEARCH_AREA_STALE_DAYS = 7;

/** If fewer than this many real local results, treat area as under-populated. */
export const SEARCH_AREA_MIN_LOCAL = 5;

/**
 * Hard safety cap — Places Text Search typically yields ≤3 pages,
 * but we follow nextPageToken until exhausted within this bound.
 */
const SEARCH_FILL_PAGE_SAFETY_CAP = 20;

const PAGE_GAP_MS = 300;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type SearchGoogleFillInput = {
  category: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
};

export type SearchGoogleFillStatus =
  | "ok"
  | "failed"
  | "partial_success"
  | "skipped";

export type SearchGoogleFillResult = {
  areaKey: string;
  /** Pages successfully fetched and processed this run. */
  totalPages: number;
  queried: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  /** 0 when complete; 1+ when a resume token is saved (more pages pending). */
  remainingPages: number;
  status: SearchGoogleFillStatus;
  resumePageToken: string | null;
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

export type SearchAreaCoverageState = {
  lastFetchedAt: string | null;
  lastStatus: string;
  resumePageToken: string | null;
  pagesFetched: number;
};

export async function getSearchAreaCoverage(
  supabase: AnySupabase,
  areaKey: string,
): Promise<SearchAreaCoverageState | null> {
  const { data } = await supabase
    .from("search_area_coverage")
    .select(
      "last_fetched_at, last_status, resume_page_token, pages_fetched",
    )
    .eq("area_key", areaKey)
    .maybeSingle();

  if (!data) return null;
  return {
    lastFetchedAt: data.last_fetched_at,
    lastStatus: data.last_status,
    resumePageToken: data.resume_page_token ?? null,
    pagesFetched: data.pages_fetched ?? 0,
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
  lastStatus?: string | null;
  hasResumeToken?: boolean;
  hasOrigin: boolean;
  hasCategory: boolean;
}): boolean {
  if (!input.hasOrigin || !input.hasCategory) return false;
  if (input.hasResumeToken || input.lastStatus === "partial_success") {
    return true;
  }
  const freshOk =
    input.lastStatus === "ok" &&
    Boolean(input.lastFetchedAt) &&
    !isSearchAreaStale(input.lastFetchedAt);
  // Sparse areas still skip Places until coverage goes stale again.
  if (freshOk) return false;
  if (input.localCount < SEARCH_AREA_MIN_LOCAL) return true;
  return isSearchAreaStale(input.lastFetchedAt);
}

async function persistFillOutcome(
  supabase: AnySupabase,
  input: {
    areaKey: string;
    categorySlug: string;
    locationLabel: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
    result: SearchGoogleFillResult;
    priorPagesFetched: number;
  },
): Promise<void> {
  const { result } = input;
  const now = new Date().toISOString();
  const pagesFetchedTotal = input.priorPagesFetched + result.totalPages;

  await supabase.from("search_area_coverage").upsert(
    {
      area_key: input.areaKey,
      category_slug: input.categorySlug,
      location_label: input.locationLabel,
      latitude: input.latitude,
      longitude: input.longitude,
      radius_km: input.radiusKm,
      last_fetched_at: now,
      last_status: result.status,
      imported_count: result.imported,
      updated_count: result.updated,
      skipped_count: result.skipped,
      failed_count: result.failed,
      error_message: result.error ?? null,
      resume_page_token: result.resumePageToken,
      pages_fetched: pagesFetchedTotal,
      updated_at: now,
    },
    { onConflict: "area_key" },
  );

  await supabase.from("search_google_import_runs").insert({
    area_key: input.areaKey,
    category_slug: input.categorySlug,
    location_label: input.locationLabel,
    latitude: input.latitude,
    longitude: input.longitude,
    radius_km: input.radiusKm,
    queried: result.queried,
    imported: result.imported,
    updated: result.updated,
    skipped: result.skipped,
    failed: result.failed,
    status: result.status,
    error_message: result.error ?? null,
    pages_fetched: result.totalPages,
    remaining_pages: result.remainingPages,
    resume_page_token: result.resumePageToken,
  });
}

/**
 * Import Google Places for a search origin into local `salons`.
 * Follows nextPageToken until exhausted; retries transient page errors;
 * resumes from a saved token on partial_success.
 * Upserts by google_place_id — never creates duplicates.
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
      totalPages: 0,
      queried: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      remainingPages: 0,
      resumePageToken: null,
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

  const prior = await getSearchAreaCoverage(supabase, areaKey);
  const resuming = Boolean(prior?.resumePageToken);

  const result: SearchGoogleFillResult = {
    areaKey,
    totalPages: 0,
    queried: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    remainingPages: 0,
    resumePageToken: null,
    status: "ok",
  };

  const locationName =
    input.locationLabel.split(",")[0]?.trim() || input.locationLabel;
  // Always pin AU searches to Queensland so "Paddington" ≠ Sydney Paddington.
  const textQuery = buildTextQuery({
    textNoun: mapping.textNoun,
    city: locationName,
    state: "Queensland",
    country: "Australia",
  });

  const radiusMeters = Math.min(
    50_000,
    Math.max(2_000, input.radiusKm * 1000),
  );
  const maxDistanceKm = Math.max(input.radiusKm * 1.35, input.radiusKm + 2);

  const seen = new Set<string>();
  let pageToken: string | null = resuming
    ? prior?.resumePageToken ?? null
    : null;
  /** Token for the page we are about to fetch — saved on hard failure. */
  let pendingResumeToken: string | null = pageToken;
  const priorPagesFetched = resuming ? (prior?.pagesFetched ?? 0) : 0;

  try {
    for (let page = 0; page < SEARCH_FILL_PAGE_SAFETY_CAP; page += 1) {
      pendingResumeToken = pageToken;

      let response;
      try {
        response = await searchTextPlacesWithRetry({
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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Places page request failed";
        // Prior pages in this or a previous run must never become a hard failed run.
        const hadPriorSuccess =
          result.totalPages > 0 ||
          result.imported + result.updated > 0 ||
          priorPagesFetched > 0;

        if (hadPriorSuccess) {
          result.status = "partial_success";
          result.error = message;
          result.resumePageToken = pendingResumeToken;
          result.remainingPages = pendingResumeToken ? 1 : 0;
          await persistFillOutcome(supabase, {
            areaKey,
            categorySlug: mapping.categorySlug,
            locationLabel: input.locationLabel,
            latitude: input.latitude,
            longitude: input.longitude,
            radiusKm: input.radiusKm,
            result,
            priorPagesFetched,
          });
          return result;
        }

        result.status = "failed";
        result.error = message;
        result.resumePageToken = null;
        result.remainingPages = 0;
        await persistFillOutcome(supabase, {
          areaKey,
          categorySlug: mapping.categorySlug,
          locationLabel: input.locationLabel,
          latitude: input.latitude,
          longitude: input.longitude,
          radiusKm: input.radiusKm,
          result,
          priorPagesFetched,
        });
        return result;
      }

      for (const place of response.places) {
        const snapshot = mapPlaceToSnapshot(
          place,
          mapping,
          {
            city: locationName,
            state: "Queensland",
            country: "Australia",
          },
          4,
        );
        if (!snapshot || seen.has(snapshot.placeId)) {
          result.skipped += 1;
          continue;
        }
        // Drop far-away namesakes (e.g. Paddington NSW) that bias can still return.
        const distKm = haversineKm(
          input.latitude,
          input.longitude,
          snapshot.latitude,
          snapshot.longitude,
        );
        if (distKm > maxDistanceKm) {
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

      result.totalPages += 1;
      pageToken = response.nextPageToken;
      if (!pageToken) break;
      await sleep(PAGE_GAP_MS);
    }

    // Exhausted or hit safety cap with leftover token.
    if (pageToken) {
      result.status = "partial_success";
      result.resumePageToken = pageToken;
      result.remainingPages = 1;
      result.error = `Stopped after ${SEARCH_FILL_PAGE_SAFETY_CAP} pages; resume token saved.`;
    } else if (result.failed > 0 && result.imported + result.updated === 0) {
      result.status = "failed";
    } else if (result.failed > 0) {
      result.status = "partial_success";
      result.error = `${result.failed} place upsert(s) failed`;
    } else {
      result.status = "ok";
      result.resumePageToken = null;
      result.remainingPages = 0;
    }

    await persistFillOutcome(supabase, {
      areaKey,
      categorySlug: mapping.categorySlug,
      locationLabel: input.locationLabel,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusKm: input.radiusKm,
      result,
      priorPagesFetched,
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google search fill failed";
    const hadPriorSuccess =
      result.totalPages > 0 ||
      result.imported + result.updated > 0 ||
      priorPagesFetched > 0;

    result.error = message;
    if (hadPriorSuccess) {
      result.status = "partial_success";
      result.resumePageToken = pendingResumeToken;
      result.remainingPages = pendingResumeToken ? 1 : 0;
    } else {
      result.status = "failed";
      result.resumePageToken = null;
      result.remainingPages = 0;
    }

    await persistFillOutcome(supabase, {
      areaKey,
      categorySlug: mapping.categorySlug,
      locationLabel: input.locationLabel,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusKm: input.radiusKm,
      result,
      priorPagesFetched,
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
