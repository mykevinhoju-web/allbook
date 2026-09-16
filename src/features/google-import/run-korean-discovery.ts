import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { shouldTagKoreanKeyword } from "@/features/korean-search/korean-relevance";

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
  // Sunnybank corridor — major Korean dining hub; city-wide queries under-fill it.
  {
    textQuery: "Korean restaurant Sunnybank",
    category: "restaurant",
    includedType: "restaurant",
  },
  {
    textQuery: "한식당 Sunnybank",
    category: "restaurant",
    includedType: "restaurant",
  },
  {
    textQuery: "Korean BBQ Sunnybank",
    category: "restaurant",
    includedType: "restaurant",
  },
  {
    textQuery: "Korean restaurant Sunnybank Hills",
    category: "restaurant",
    includedType: "restaurant",
  },
];

/**
 * Next incremental category after Brisbane hair + restaurant quality check:
 * Korean marts / groceries (plan: Brisbane 마트).
 */
export const BRISBANE_KOREAN_MART_QUERIES: KoreanDiscoveryQuery[] = [
  { textQuery: "Korean grocery Brisbane", category: "mart", includedType: "supermarket" },
  { textQuery: "Korean supermarket Brisbane", category: "mart", includedType: "supermarket" },
  { textQuery: "Korean mart Brisbane", category: "mart" },
  { textQuery: "한인 마트 Brisbane", category: "mart" },
  { textQuery: "하나로마트 Brisbane", category: "mart" },
  { textQuery: "Hanaro Mart Brisbane", category: "mart", includedType: "supermarket" },
  { textQuery: "Hanaromart Chermside", category: "mart" },
  { textQuery: "Hanaromart Carindale", category: "mart" },
  { textQuery: "Hanaromart Indooroopilly", category: "mart" },
  { textQuery: "Hanaromart Garden City Upper Mount Gravatt", category: "mart" },
  { textQuery: "Hanaromart Pinelands Sunnybank Hills", category: "mart" },
  { textQuery: "Hanaromart Calamvale", category: "mart" },
  { textQuery: "Hanaromart Underwood", category: "mart" },
  { textQuery: "Hanaromart Toowong", category: "mart" },
  { textQuery: "Hanaromart Buranda", category: "mart" },
  { textQuery: "Hanaromart Spring Hill", category: "mart" },
  { textQuery: "Hanaromart Sunnybank", category: "mart" },
  { textQuery: "Hoju Mart Brisbane", category: "mart" },
  { textQuery: "K Fresh Mart Brisbane", category: "mart" },
  { textQuery: "K Fresh Mart Sunnybank", category: "mart" },
  { textQuery: "K Fresh Mart Stafford Heights Rode Road", category: "mart" },
  { textQuery: "K Fresh mart Chermside Stafford Heights", category: "mart" },
  { textQuery: "Moamart Brisbane", category: "mart" },
  { textQuery: "Good Morning Mart Brisbane", category: "mart" },
  { textQuery: "Lucky Mart Eight Mile Plains", category: "mart" },
  { textQuery: "Korean grocery Sunnybank", category: "mart", includedType: "supermarket" },
  { textQuery: "Korean grocery Chermside", category: "mart" },
  { textQuery: "Korean grocery Carindale", category: "mart" },
  { textQuery: "Korean grocery Indooroopilly", category: "mart" },
];

export type KoreanDiscoveryPreset = "hair-restaurant" | "mart";

export function resolveKoreanDiscoveryQueries(
  preset: KoreanDiscoveryPreset = "hair-restaurant",
): KoreanDiscoveryQuery[] {
  if (preset === "mart") return BRISBANE_KOREAN_MART_QUERIES;
  return BRISBANE_KOREAN_DISCOVERY_QUERIES;
}

async function ensureMarketplaceCategories(supabase: AnySupabase): Promise<void> {
  const rows = [
    { name: "Restaurant", slug: "restaurant", icon: "utensils", sort_order: 7 },
    { name: "Mart", slug: "mart", icon: "shopping-bag", sort_order: 8 },
  ];
  for (const row of rows) {
    const { data } = await supabase
      .from("business_categories")
      .select("id")
      .eq("slug", row.slug)
      .maybeSingle();
    if (data?.id) continue;
    const { error } = await supabase.from("business_categories").insert(row);
    if (error && !/duplicate|unique/i.test(error.message)) {
      throw new Error(`Failed to seed category ${row.slug}: ${error.message}`);
    }
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
 * Tags `korean` only when relevance passes; otherwise `korean_candidate`.
 */
export async function runKoreanBusinessDiscovery(
  supabase: AnySupabase,
  options: {
    city?: string;
    state?: string;
    country?: string;
    queries?: KoreanDiscoveryQuery[];
    /** Named preset when `queries` omitted. */
    preset?: KoreanDiscoveryPreset;
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
  const queries =
    options.queries ??
    resolveKoreanDiscoveryQueries(options.preset ?? "hair-restaurant");
  const maxPages = Math.max(1, options.maxPages ?? 3);
  const pageSize = Math.min(20, Math.max(1, options.pageSize ?? 20));
  const biasRadiusMeters = options.biasRadiusMeters ?? 35_000;
  const maxPhotos = Math.max(0, options.maxPhotos ?? 4);
  const dryRun = Boolean(options.dryRun);

  await ensureMarketplaceCategories(supabase);

  const target: GoogleImportTarget = {
    city,
    state,
    country,
    category: `korean-discovery:${options.preset ?? "hair-restaurant"}`,
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
      const softKeywordService = /^(Hair|Barber|Nails|Spa)$/i.test(
        snapshot.primaryService,
      );
      const tagKorean = shouldTagKoreanKeyword({
        name: snapshot.name,
        suburb: snapshot.suburb,
        city: snapshot.city,
        state: snapshot.state,
        service: snapshot.primaryService,
        googleCategories: snapshot.googleCategories,
        // Hair discovery queries are Korean-intent; allow soft keyword path.
        searchKeywords: softKeywordService ? ["korean"] : [],
      });
      await mergeSearchKeywords(
        supabase,
        upsert.salonId,
        tagKorean ? ["korean"] : ["korean_candidate"],
      );
    }
    await sleep(80);
  }

  return result;
}
