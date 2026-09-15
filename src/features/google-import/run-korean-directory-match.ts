import seedFileJson from "./data/brisbane-korean-directory-seeds.json";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { resolvePlacesCategoryMapping } from "./category-map";
import { mapPlaceToSnapshot } from "./map-place";
import {
  getPlaceDetails,
  searchTextPlaces,
  sleep,
} from "./places-client";
import type {
  GoogleImportPlaceResult,
  GoogleImportRunResult,
  GoogleImportTarget,
} from "./types";
import { upsertGoogleSalon } from "./upsert-google-salon";

type AnySupabase = SupabaseClient<Database>;

export type KoreanDirectorySeed = {
  name: string;
  phone: string | null;
  address: string | null;
  mapsQuery: string | null;
  website: string | null;
  detailUrl: string | null;
  category: string;
  source: string;
};

export type KoreanDirectorySeedFile = {
  source: string;
  generatedAt: string;
  scope: string;
  counts: Record<string, number>;
  categories: Record<string, KoreanDirectorySeed[]>;
};

export type KoreanDirectoryMatchOptions = {
  categories?: string[];
  dryRun?: boolean;
  maxPhotos?: number;
  city?: string;
  state?: string;
  country?: string;
  seeds?: KoreanDirectorySeedFile;
};

function digits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function phoneCompatible(seedPhone: string | null, placePhone: string | null) {
  const a = digits(seedPhone);
  const b = digits(placePhone);
  if (!a || !b) return true; // no phone to compare — allow
  if (a.length < 8 || b.length < 8) return true;
  return a.slice(-8) === b.slice(-8);
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

async function mergeSearchKeywords(
  supabase: AnySupabase,
  salonId: string,
  extra: string[],
) {
  if (!extra.length) return;
  const { data } = await supabase
    .from("salons")
    .select("search_keywords")
    .eq("id", salonId)
    .maybeSingle();
  const existing = (data?.search_keywords ?? []).filter(Boolean);
  const merged = [
    ...new Set([...existing, ...extra.map((k) => k.toLowerCase())]),
  ];
  if (
    merged.length === existing.length &&
    merged.every((k) => existing.includes(k))
  ) {
    return;
  }
  await supabase
    .from("salons")
    .update({
      search_keywords: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("id", salonId);
}

async function ensureRestaurantCategory(supabase: AnySupabase) {
  const { data } = await supabase
    .from("business_categories")
    .select("id")
    .eq("slug", "restaurant")
    .maybeSingle();
  if (data?.id) return;
  await supabase.from("business_categories").insert({
    name: "Restaurant",
    slug: "restaurant",
    icon: "utensils",
    sort_order: 7,
  });
}

export function loadBundledKoreanDirectorySeeds(): KoreanDirectorySeedFile {
  return seedFileJson as KoreanDirectorySeedFile;
}

/**
 * Match QLDVision-style directory seeds to Google Places, then upsert.
 * Only seeds with addresses are matched (Maps-linkable).
 */
export async function runKoreanDirectoryMatch(
  supabase: AnySupabase,
  options: KoreanDirectoryMatchOptions = {},
): Promise<
  GoogleImportRunResult & {
    matched: number;
    unmatched: Array<{ name: string; address: string | null; reason: string }>;
    byCategory: Record<
      string,
      { seeds: number; matched: number; inserted: number; updated: number }
    >;
  }
> {
  const city = options.city ?? "Brisbane";
  const state = options.state ?? "Queensland";
  const country = options.country ?? "Australia";
  const dryRun = Boolean(options.dryRun);
  const maxPhotos = options.maxPhotos ?? 4;
  const seedFile = options.seeds ?? loadBundledKoreanDirectorySeeds();
  const categoryFilter = options.categories?.map((c) => c.toLowerCase());

  await ensureRestaurantCategory(supabase);

  const target: GoogleImportTarget = {
    city,
    state,
    country,
    category: "korean-directory",
    scope: "city",
  };
  const result = emptyResult(target);
  const unmatched: Array<{
    name: string;
    address: string | null;
    reason: string;
  }> = [];
  const byCategory: Record<
    string,
    { seeds: number; matched: number; inserted: number; updated: number }
  > = {};
  const seenPlaceIds = new Set<string>();
  let matched = 0;

  const entries = Object.entries(seedFile.categories).filter(([cat]) => {
    if (!categoryFilter?.length) return true;
    return categoryFilter.includes(cat.toLowerCase());
  });

  for (const [category, seeds] of entries) {
    byCategory[category] = {
      seeds: seeds.length,
      matched: 0,
      inserted: 0,
      updated: 0,
    };
    const mapping = resolvePlacesCategoryMapping(category);

    for (const seed of seeds) {
      result.queried += 1;
      if (!seed.address) {
        unmatched.push({
          name: seed.name,
          address: null,
          reason: "missing_address",
        });
        result.skipped += 1;
        continue;
      }

      const textQuery = `${seed.name} ${seed.address}`;
      try {
        const page = await searchTextPlaces({
          textQuery,
          pageSize: 5,
          regionCode: "AU",
          includedType: mapping.includedType,
        });
        const candidates = page.places ?? [];
        let chosen = candidates[0] ?? null;

        if (chosen && seed.phone) {
          const phoneOk = candidates.find((p) =>
            phoneCompatible(
              seed.phone,
              p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
            ),
          );
          if (phoneOk) chosen = phoneOk;
          else if (
            !phoneCompatible(
              seed.phone,
              chosen.nationalPhoneNumber ??
                chosen.internationalPhoneNumber ??
                null,
            )
          ) {
            // Soft fail: still take first if name/address query was specific.
          }
        }

        if (!chosen?.id) {
          unmatched.push({
            name: seed.name,
            address: seed.address,
            reason: "no_places_match",
          });
          result.skipped += 1;
          await sleep(200);
          continue;
        }

        const placeId = chosen.id.replace(/^places\//, "");
        if (seenPlaceIds.has(placeId)) {
          result.skipped += 1;
          await sleep(120);
          continue;
        }
        seenPlaceIds.add(placeId);

        const detailed = await getPlaceDetails(placeId);
        const snapshot = mapPlaceToSnapshot(
          detailed,
          mapping,
          { city, state, country },
          maxPhotos,
        );
        if (!snapshot) {
          unmatched.push({
            name: seed.name,
            address: seed.address,
            reason: "snapshot_failed",
          });
          result.skipped += 1;
          continue;
        }

        matched += 1;
        byCategory[category]!.matched += 1;

        if (dryRun) {
          result.places.push({
            placeId: snapshot.placeId,
            name: snapshot.name,
            action: "skipped",
          });
          result.skipped += 1;
        } else {
          const upsert = await upsertGoogleSalon(supabase, snapshot);
          tally(result, upsert);
          if (upsert.action === "inserted") byCategory[category]!.inserted += 1;
          if (upsert.action === "updated") byCategory[category]!.updated += 1;
          if (upsert.salonId && upsert.action !== "failed") {
            await mergeSearchKeywords(supabase, upsert.salonId, ["korean"]);
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "match failed";
        unmatched.push({
          name: seed.name,
          address: seed.address,
          reason: message,
        });
        result.failed += 1;
        result.errors.push(`${seed.name}: ${message}`);
      }

      await sleep(250);
    }
  }

  result.cellsProcessed = entries.length;
  return { ...result, matched, unmatched, byCategory };
}
