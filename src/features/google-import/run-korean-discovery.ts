import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { resolvePlacesCategoryMapping } from "./category-map";
import { mapPlaceToSnapshot } from "./map-place";
import {
  geocodeImportCenter,
  searchTextPlaces,
  sleep,
} from "./places-client";
import type {
  GoogleImportPlaceResult,
  GoogleImportRunResult,
  GoogleImportTarget,
  GooglePlaceSnapshot,
} from "./types";
import { upsertGoogleSalon } from "./upsert-google-salon";

type AnySupabase = SupabaseClient<Database>;

export type KoreanDiscoveryQuery = {
  textQuery: string;
  category: string;
  includedType?: string;
};

/** Brisbane-first Korean discovery queries (hair + restaurants). */
export const BRISBANE_KOREAN_DISCOVERY_QUERIES: KoreanDiscoveryQuery[] = [
  {
    textQuery: "Korean hair salon Brisbane",
    category: "hair",
    includedType: "hair_salon",
  },
  {
    textQuery: "Korean beauty salon Brisbane",
    category: "hair",
    includedType: "beauty_salon",
  },
  {
    textQuery: "한인 미용실 Brisbane",
    category: "hair",
  },
  {
    textQuery: "Korean restaurant Brisbane",
    category: "restaurant",
    includedType: "restaurant",
  },
  {
    textQuery: "한식당 Brisbane",
    category: "restaurant",
    includedType: "restaurant",
  },
  {
    textQuery: "Korean BBQ Brisbane",
    category: "restaurant",
    includedType: "restaurant",
  },
];

async function ensureRestaurantCategory(supabase: AnySupabase): Promise<void> {
  const { data } = await supabase
    .from("business_categories")
    .select("id")
    .eq("slug", "restaurant")
    .maybeSingle();
  if (data?.id) return;

  const { error } = await supabase.from("business_categories").insert({
    name: "Restaurant",
    slug: "restaurant",
    icon: "utensils",
    sort_order: 7,
  });
  if (error && !/duplicate|unique/i.test(error.message)) {
    throw new Error(`Failed to seed restaurant category: ${error.message}`);
  }
}

async function mergeSearchKeywords(
  supabase: AnySupabase,
  salonId: string,
  extra: string[],
): Promise<void> {
  if (!extra.length) return;
  const { data } = await supabase
    .from("salons")
    .select("search_keywords")
    .eq("id", salonId)
    .maybeSingle();
  const existing = (data?.search_keywords ?? []).filter(Boolean);
  const merged = [...new Set([...existing, ...extra.map((k) => k.toLowerCase())])];
  if (
    merged.length === existing.length &&
    merged.every((k) => existing.includes(k))
  ) {
    return;
  }
  await supabase
    .from("salons")
    .update({ search_keywords: merged, updated_at: new Date().toISOString() })
    .eq("id", salonId);
}

function emptyResult(target: GoogleImportTarget): GoogleImportRunResult {
  return {
    target,
    queried: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    places: [],
    cellsProcessed: 0,
  };
}

function tally(
  result: GoogleImportRunResult,
  upsert: GoogleImportPlaceResult,
) {
  result.places.push(upsert);
  if (upsert.action === "inserted") result.inserted += 1;
  else if (upsert.action === "updated") result.updated += 1;
  else if (upsert.action === "failed") {
    result.failed += 1;
    if (upsert.error) result.errors.push(`${upsert.name}: ${upsert.error}`);
  } else result.skipped += 1;
}

/**
 * Discover + upsert Korean businesses with custom Places text queries.
 * Tags every successful row with search_keywords including "korean".
 */
export async function runKoreanBusinessDiscovery(
  supabase: AnySupabase,
  options: {
    city?: string;
    state?: string;
    country?: string;
    queries?: KoreanDiscoveryQuery[];
    maxPages?: number;
    pageSize?: number;
    biasRadiusMeters?: number;
    dryRun?: boolean;
    maxPhotos?: number;
  } = {},
): Promise<GoogleImportRunResult> {
  const city = options.city ?? "Brisbane";
  const state = options.state ?? "Queensland";
  const country = options.country ?? "Australia";
  const queries = options.queries ?? BRISBANE_KOREAN_DISCOVERY_QUERIES;
  const maxPages = Math.max(1, options.maxPages ?? 3);
  const pageSize = Math.min(20, Math.max(1, options.pageSize ?? 20));
  const biasRadiusMeters = options.biasRadiusMeters ?? 35_000;
  const maxPhotos = Math.max(0, options.maxPhotos ?? 4);
  const dryRun = Boolean(options.dryRun);

  await ensureRestaurantCategory(supabase);

  const target: GoogleImportTarget = {
    city,
    state,
    country,
    category: "korean-discovery",
    scope: "city",
  };
  const result = emptyResult(target);
  const seen = new Set<string>();
  const snapshots: GooglePlaceSnapshot[] = [];

  const center = await geocodeImportCenter({ city, state, country });

  for (const query of queries) {
    const mapping = resolvePlacesCategoryMapping(query.category);
    let pageToken: string | null = null;

    for (let page = 0; page < maxPages; page += 1) {
      const response = await searchTextPlaces({
        textQuery: query.textQuery,
        includedType: query.includedType ?? mapping.includedType,
        pageSize,
        pageToken,
        regionCode: /australia/i.test(country) ? "AU" : undefined,
        locationBias: center
          ? { center, radiusMeters: biasRadiusMeters }
          : undefined,
      });

      for (const place of response.places) {
        const snapshot = mapPlaceToSnapshot(
          place,
          mapping,
          { city, state, country },
          maxPhotos,
        );
        if (!snapshot || seen.has(snapshot.placeId)) continue;
        seen.add(snapshot.placeId);
        snapshots.push(snapshot);
      }

      pageToken = response.nextPageToken;
      if (!pageToken) break;
      await sleep(350);
    }

    await sleep(200);
  }

  result.queried = snapshots.length;
  result.cellsProcessed = 1;

  if (dryRun) {
    for (const snapshot of snapshots) {
      result.places.push({
        placeId: snapshot.placeId,
        name: snapshot.name,
        action: "skipped",
      });
      result.skipped += 1;
    }
    return result;
  }

  for (const snapshot of snapshots) {
    const upsert = await upsertGoogleSalon(supabase, snapshot);
    tally(result, upsert);
    if (upsert.salonId && upsert.action !== "failed") {
      await mergeSearchKeywords(supabase, upsert.salonId, ["korean"]);
    }
    await sleep(80);
  }

  return result;
}
