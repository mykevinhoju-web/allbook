import qldvisionSeedFileJson from "./data/brisbane-korean-directory-seeds.json";
import hanaromartSeedFileJson from "./data/hanaromart-brisbane-seeds.json";
import sundayweeklySeedFileJson from "./data/sundayweekly-qld-directory-seeds.json";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { shouldTagKoreanKeyword } from "@/features/korean-search/korean-relevance";

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
  directoryCategory?: string;
  source: string;
  confidence?: string | null;
};

export type KoreanDirectorySeedFile = {
  source: string;
  generatedAt: string;
  scope: string;
  counts: Record<string, number>;
  categories: Record<string, KoreanDirectorySeed[]>;
};

export type KoreanDirectorySeedBundle =
  | "qldvision"
  | "sundayweekly"
  | "hanaromart";

export type KoreanDirectoryMatchOptions = {
  categories?: string[];
  dryRun?: boolean;
  maxPhotos?: number;
  city?: string;
  state?: string;
  country?: string;
  seeds?: KoreanDirectorySeedFile;
  /** Which bundled seed file to use when `seeds` is omitted. */
  seedBundle?: KoreanDirectorySeedBundle;
  /** Slice seeds inside each selected category (for Vercel time limits). */
  limit?: number;
  offset?: number;
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

async function ensureMarketplaceCategories(supabase: AnySupabase) {
  const rows = [
    { name: "Restaurant", slug: "restaurant", icon: "utensils", sort_order: 7 },
    { name: "Mart", slug: "mart", icon: "shopping-bag", sort_order: 8 },
    { name: "Medical", slug: "medical", icon: "stethoscope", sort_order: 9 },
    { name: "Academy", slug: "academy", icon: "graduation-cap", sort_order: 10 },
    {
      name: "Entertainment",
      slug: "entertainment",
      icon: "music",
      sort_order: 11,
    },
    { name: "Services", slug: "services", icon: "briefcase", sort_order: 12 },
  ];
  for (const row of rows) {
    const { data } = await supabase
      .from("business_categories")
      .select("id")
      .eq("slug", row.slug)
      .maybeSingle();
    if (data?.id) continue;
    await supabase.from("business_categories").insert(row);
  }
}

export function loadBundledKoreanDirectorySeeds(
  bundle: KoreanDirectorySeedBundle = "qldvision",
): KoreanDirectorySeedFile {
  if (bundle === "sundayweekly") {
    return sundayweeklySeedFileJson as KoreanDirectorySeedFile;
  }
  if (bundle === "hanaromart") {
    return hanaromartSeedFileJson as KoreanDirectorySeedFile;
  }
  return qldvisionSeedFileJson as KoreanDirectorySeedFile;
}

/**
 * Match directory seeds (QLDVision / Sunday Weekly) to Google Places, then upsert.
 * Phone-only seeds require a phone match before address/geo is trusted.
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
    seedBundle: KoreanDirectorySeedBundle;
    offset: number;
    limit: number | null;
  }
> {
  const city = options.city ?? "Brisbane";
  const state = options.state ?? "Queensland";
  const country = options.country ?? "Australia";
  const dryRun = Boolean(options.dryRun);
  const maxPhotos = options.maxPhotos ?? 4;
  const seedBundle = options.seedBundle ?? "qldvision";
  const seedFile =
    options.seeds ?? loadBundledKoreanDirectorySeeds(seedBundle);
  const categoryFilter = options.categories?.map((c) => c.toLowerCase());
  const offset = Math.max(0, options.offset ?? 0);
  const limit =
    options.limit != null && Number.isFinite(options.limit)
      ? Math.max(1, Math.floor(options.limit))
      : null;

  await ensureMarketplaceCategories(supabase);

  const target: GoogleImportTarget = {
    city,
    state,
    country,
    category: `korean-directory:${seedBundle}`,
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

  for (const [category, allSeeds] of entries) {
    const seeds = limit
      ? allSeeds.slice(offset, offset + limit)
      : allSeeds.slice(offset);
    byCategory[category] = {
      seeds: seeds.length,
      matched: 0,
      inserted: 0,
      updated: 0,
    };
    const mapping = resolvePlacesCategoryMapping(category);

    for (const seed of seeds) {
      result.queried += 1;
      if (!seed.address && !seed.phone && !seed.name) {
        unmatched.push({
          name: seed.name,
          address: null,
          reason: "missing_contact",
        });
        result.skipped += 1;
        continue;
      }

      const phoneOnly = !seed.address && Boolean(seed.phone);
      const textQuery = seed.mapsQuery
        ? `${seed.mapsQuery} Queensland Australia`
        : seed.address
          ? `${seed.name} ${seed.address}`
          : seedBundle === "sundayweekly"
            ? `${seed.name} Queensland Australia`
            : `${seed.name} Brisbane Queensland`;
      try {
        // Phone-only: omit includedType so Places can match across types.
        const page = await searchTextPlaces({
          textQuery,
          pageSize: 8,
          regionCode: "AU",
          includedType: phoneOnly ? undefined : mapping.includedType,
        });
        const candidates = page.places ?? [];
        let chosen = candidates[0] ?? null;

        // Prefer a candidate whose name overlaps the seed (avoid Coles/Woolworths).
        const seedNameKey = seed.name
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]+/g, " ")
          .trim();
        const seedTokens = seedNameKey
          .split(/\s+/)
          .filter((t) => t.length >= 4);
        const nameMatched = candidates.find((p) => {
          const n = (p.displayName?.text ?? "").toLowerCase();
          if (!n) return false;
          if (/woolworths|coles|aldi|costco|\biga\b/.test(n)) return false;
          if (seedTokens.some((t) => n.includes(t))) return true;
          if (/hanaro/.test(seedNameKey) && /hanaro/.test(n)) return true;
          return false;
        });
        if (nameMatched) chosen = nameMatched;

        if (seed.phone) {
          const phoneOk = candidates.find((p) =>
            phoneCompatible(
              seed.phone,
              p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
            ),
          );
          if (phoneOk) chosen = phoneOk;
        }

        // Phone-only seeds: require phone match.
        if (phoneOnly && chosen) {
          const ok = phoneCompatible(
            seed.phone,
            chosen.nationalPhoneNumber ??
              chosen.internationalPhoneNumber ??
              null,
          );
          if (!ok) {
            unmatched.push({
              name: seed.name,
              address: seed.address,
              reason: "phone_mismatch",
            });
            result.skipped += 1;
            await sleep(180);
            continue;
          }
        }

        // Address seeds for branded marts: reject supermarket chains.
        if (chosen && seed.address) {
          const n = (chosen.displayName?.text ?? "").toLowerCase();
          if (/woolworths|coles|aldi|costco|\biga\b/.test(n)) {
            unmatched.push({
              name: seed.name,
              address: seed.address,
              reason: "chain_mismatch",
            });
            result.skipped += 1;
            await sleep(180);
            continue;
          }
        }

        if (!chosen?.id) {
          unmatched.push({
            name: seed.name,
            address: seed.address,
            reason: "no_places_match",
          });
          result.skipped += 1;
          await sleep(180);
          continue;
        }

        const placeId = chosen.id.replace(/^places\//, "");
        if (seenPlaceIds.has(placeId)) {
          result.skipped += 1;
          await sleep(100);
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
            const provenance =
              seedBundle === "sundayweekly"
                ? ["sundayweekly"]
                : seedBundle === "hanaromart"
                  ? ["hanaromart", "korean_verified"]
                  : ["qldvision"];
            const tagKorean = shouldTagKoreanKeyword({
              name: snapshot.name,
              suburb: snapshot.suburb,
              city: snapshot.city,
              state: snapshot.state,
              service: snapshot.primaryService,
              googleCategories: snapshot.googleCategories,
              searchKeywords: provenance,
            });
            await mergeSearchKeywords(
              supabase,
              upsert.salonId,
              tagKorean
                ? ["korean", ...provenance]
                : ["korean_candidate", ...provenance],
            );
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

      await sleep(220);
    }
  }

  result.cellsProcessed = entries.length;
  return {
    ...result,
    matched,
    unmatched,
    byCategory,
    seedBundle,
    offset,
    limit,
  };
}
