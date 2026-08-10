import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  buildSearchAreaKey,
  fillSearchAreaFromGoogle,
  getSearchAreaCoverage,
  isSearchAreaStale,
} from "./auto-google-import";
import { BRISBANE_SUBURBS } from "./brisbane-suburbs";

type AnySupabase = SupabaseClient<Database>;

export const BRISBANE_SUBURB_FILL_DEFAULT_RADIUS_KM = 8;
export const BRISBANE_SUBURB_FILL_DEFAULT_BATCH = 2;
export const BRISBANE_SUBURB_FILL_CATEGORIES = [
  "hair",
  "nails",
  "spa",
  "barber",
  "massage",
] as const;

export type BrisbaneSuburbFillCategory =
  (typeof BRISBANE_SUBURB_FILL_CATEGORIES)[number];

export type BrisbaneSuburbFillInput = {
  category?: string;
  /** Process several categories in one queue (suburb-major order). */
  categories?: string[];
  radiusKm?: number;
  /** Max suburbs to fill in this invocation (Places-bound). */
  batchSize?: number;
  force?: boolean;
};

export type BrisbaneSuburbFillItemResult = {
  suburb: string;
  category: string;
  status: string;
  queried: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  error: string | null;
};

export type BrisbaneSuburbFillBatchResult = {
  categories: string[];
  radiusKm: number;
  totalTargets: number;
  processed: number;
  skippedFresh: number;
  remaining: number;
  done: boolean;
  items: BrisbaneSuburbFillItemResult[];
  totals: {
    queried: number;
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
  };
};

function normalizeCategories(input: BrisbaneSuburbFillInput): string[] {
  const raw =
    input.categories?.length
      ? input.categories
      : [input.category ?? "hair"];
  const allowed = new Set<string>(BRISBANE_SUBURB_FILL_CATEGORIES);
  const out: string[] = [];
  for (const value of raw) {
    const key = value.trim().toLowerCase();
    if (!key || !allowed.has(key) || out.includes(key)) continue;
    out.push(key);
  }
  return out.length > 0 ? out : ["hair"];
}

function needsFill(coverage: Awaited<ReturnType<typeof getSearchAreaCoverage>>) {
  if (!coverage) return true;
  if (coverage.resumePageToken || coverage.lastStatus === "partial_success") {
    return true;
  }
  if (coverage.lastStatus !== "ok") return true;
  return isSearchAreaStale(coverage.lastFetchedAt);
}

/**
 * Walk Greater Brisbane suburbs sequentially and fill missing/stale Places coverage.
 * Designed for cron: each call processes up to `batchSize` suburbs, then returns
 * how many targets remain so the next tick continues automatically.
 */
export async function runBrisbaneSuburbFillBatch(
  supabase: AnySupabase,
  input: BrisbaneSuburbFillInput = {},
): Promise<BrisbaneSuburbFillBatchResult> {
  const categories = normalizeCategories(input);
  const radiusKm = Math.min(
    50,
    Math.max(2, input.radiusKm ?? BRISBANE_SUBURB_FILL_DEFAULT_RADIUS_KM),
  );
  const batchSize = Math.min(
    20,
    Math.max(1, input.batchSize ?? BRISBANE_SUBURB_FILL_DEFAULT_BATCH),
  );
  const force = Boolean(input.force);

  const targets: Array<{
    category: string;
    suburb: (typeof BRISBANE_SUBURBS)[number];
  }> = [];
  for (const suburb of BRISBANE_SUBURBS) {
    for (const category of categories) {
      targets.push({ category, suburb });
    }
  }

  const result: BrisbaneSuburbFillBatchResult = {
    categories,
    radiusKm,
    totalTargets: targets.length,
    processed: 0,
    skippedFresh: 0,
    remaining: 0,
    done: false,
    items: [],
    totals: {
      queried: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    },
  };

  let filled = 0;
  let pendingAfter = 0;

  for (const target of targets) {
    const { suburb, category } = target;
    const areaKey = buildSearchAreaKey({
      categorySlug: category,
      latitude: suburb.latitude,
      longitude: suburb.longitude,
      radiusKm,
    });
    const coverage = await getSearchAreaCoverage(supabase, areaKey);

    if (!force && !needsFill(coverage)) {
      result.skippedFresh += 1;
      continue;
    }

    if (filled >= batchSize) {
      pendingAfter += 1;
      continue;
    }

    const locationLabel = `${suburb.name} QLD ${suburb.postcode}, Australia`;
    const fill = await fillSearchAreaFromGoogle(supabase, {
      category,
      locationLabel,
      latitude: suburb.latitude,
      longitude: suburb.longitude,
      radiusKm,
    });

    filled += 1;
    result.processed += 1;
    result.totals.queried += fill.queried;
    result.totals.imported += fill.imported;
    result.totals.updated += fill.updated;
    result.totals.skipped += fill.skipped;
    result.totals.failed += fill.failed;
    result.items.push({
      suburb: suburb.name,
      category,
      status: fill.status,
      queried: fill.queried,
      imported: fill.imported,
      updated: fill.updated,
      skipped: fill.skipped,
      failed: fill.failed,
      error: fill.error ?? null,
    });
  }

  result.remaining = pendingAfter;
  result.done = pendingAfter === 0;
  return result;
}
