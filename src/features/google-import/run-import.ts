import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  buildTextQuery,
  resolvePlacesCategoryMapping,
} from "./category-map";
import { resolveImportGeoCells } from "./geo";
import { mapPlaceToSnapshot } from "./map-place";
import {
  geocodeImportCenter,
  getPlaceDetails,
  searchTextPlaces,
  sleep,
} from "./places-client";
import type {
  GoogleImportOptions,
  GoogleImportPreviewItem,
  GoogleImportPreviewResult,
  GoogleImportRunResult,
  GoogleImportTarget,
  GooglePlaceSnapshot,
} from "./types";
import { upsertGoogleSalon } from "./upsert-google-salon";

type AnySupabase = SupabaseClient<Database>;

function emptyRunResult(target: GoogleImportTarget): GoogleImportRunResult {
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
  upsert: Awaited<ReturnType<typeof upsertGoogleSalon>>,
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
 * Discover places across one or more geo cells (suburb → Australia).
 */
export async function discoverGooglePlaceSnapshots(
  target: GoogleImportTarget,
  options: GoogleImportOptions = {},
): Promise<{
  snapshots: GooglePlaceSnapshot[];
  cellsProcessed: number;
}> {
  const mapping = resolvePlacesCategoryMapping(target.category);
  const cells = resolveImportGeoCells(target);
  const pageSize = Math.min(20, Math.max(1, options.pageSize ?? 20));
  const maxPhotos = Math.max(0, options.maxPhotos ?? 4);
  const seen = new Set<string>();
  const snapshots: GooglePlaceSnapshot[] = [];

  for (const cell of cells) {
    const maxPages = Math.max(
      1,
      options.maxPages ?? cell.defaultMaxPages,
    );
    const biasRadius =
      options.biasRadiusMeters ?? cell.biasRadiusMeters;

    const textQuery = buildTextQuery({
      textNoun: mapping.textNoun,
      city: cell.suburb || cell.city,
      state: cell.state,
      country: cell.country,
    });

    const center = await geocodeImportCenter({
      city: cell.city,
      state: cell.state,
      country: cell.country,
    });

    let pageToken: string | null = null;
    for (let page = 0; page < maxPages; page += 1) {
      const response = await searchTextPlaces({
        textQuery,
        includedType: mapping.includedType,
        pageSize,
        pageToken,
        regionCode: /australia/i.test(cell.country) ? "AU" : undefined,
        locationBias: center
          ? { center, radiusMeters: biasRadius }
          : undefined,
      });

      for (const place of response.places) {
        const snapshot = mapPlaceToSnapshot(
          place,
          mapping,
          {
            city: cell.city,
            state: cell.state,
            country: cell.country,
          },
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

  return { snapshots, cellsProcessed: cells.length };
}

/**
 * Admin preview — Google discovery + existing DB flags. No writes.
 */
export async function previewGoogleBusinessImport(
  supabase: AnySupabase,
  target: GoogleImportTarget,
  options: GoogleImportOptions = {},
): Promise<GoogleImportPreviewResult> {
  const { snapshots, cellsProcessed } = await discoverGooglePlaceSnapshots(
    target,
    options,
  );

  const placeIds = snapshots.map((s) => s.placeId);
  const existing = new Map<string, { claimed: boolean }>();

  if (placeIds.length > 0) {
    // Chunk IN queries
    for (let i = 0; i < placeIds.length; i += 100) {
      const chunk = placeIds.slice(i, i + 100);
      const { data } = await supabase
        .from("salons")
        .select("google_place_id, claimed")
        .in("google_place_id", chunk);
      for (const row of data ?? []) {
        if (row.google_place_id) {
          existing.set(row.google_place_id, { claimed: row.claimed });
        }
      }
    }
  }

  const items: GoogleImportPreviewItem[] = snapshots.map((s) => {
    const ex = existing.get(s.placeId);
    return {
      placeId: s.placeId,
      name: s.name,
      address: s.address,
      suburb: s.suburb,
      city: s.city,
      state: s.state,
      rating: s.rating,
      reviewCount: s.reviewCount,
      phone: s.phone,
      website: s.website,
      primaryType: s.primaryType,
      googleCategories: s.googleCategories,
      alreadyImported: Boolean(ex),
      claimed: ex?.claimed ?? false,
      photoUrl: s.photos[0]?.mediaUrl ?? null,
    };
  });

  return {
    target,
    items,
    cellsProcessed,
    queried: items.length,
  };
}

/**
 * Import selected place IDs (admin checkbox flow).
 * Re-fetches Place Details so commit does not trust the browser payload.
 */
export async function importSelectedGooglePlaces(
  supabase: AnySupabase,
  input: {
    placeIds: string[];
    category: string;
    country: string;
    state?: string;
    city?: string;
  },
  options: { maxPhotos?: number } = {},
): Promise<GoogleImportRunResult> {
  const target: GoogleImportTarget = {
    country: input.country,
    state: input.state,
    city: input.city,
    category: input.category,
    scope: "city",
  };
  const result = emptyRunResult(target);
  const mapping = resolvePlacesCategoryMapping(input.category);
  const maxPhotos = options.maxPhotos ?? 4;
  const defaults = {
    city: input.city?.trim() || input.state?.trim() || input.country,
    state: input.state?.trim() || input.country,
    country: input.country.trim(),
  };

  const uniqueIds = [...new Set(input.placeIds.map((id) => id.trim()).filter(Boolean))];
  result.queried = uniqueIds.length;

  for (const placeId of uniqueIds) {
    try {
      const place = await getPlaceDetails(placeId);
      const snapshot = mapPlaceToSnapshot(
        place,
        mapping,
        defaults,
        maxPhotos,
      );
      if (!snapshot) {
        result.failed += 1;
        result.places.push({
          placeId,
          name: place.displayName?.text ?? placeId,
          action: "failed",
          error: "Incomplete place details",
        });
        continue;
      }
      const upsert = await upsertGoogleSalon(supabase, snapshot);
      tally(result, upsert);
      await sleep(120);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      result.failed += 1;
      result.errors.push(`${placeId}: ${message}`);
      result.places.push({
        placeId,
        name: placeId,
        action: "failed",
        error: message,
      });
    }
  }

  return result;
}

/**
 * Production Google → AllBook discovery import (full cell fan-out).
 * Does not touch ranking, booking, or marketplace search URLs.
 */
export async function runGoogleBusinessImport(
  supabase: AnySupabase,
  target: GoogleImportTarget,
  options: GoogleImportOptions = {},
): Promise<GoogleImportRunResult> {
  const result = emptyRunResult(target);
  const dryRun = options.dryRun ?? false;

  const { snapshots, cellsProcessed } = await discoverGooglePlaceSnapshots(
    target,
    options,
  );
  result.cellsProcessed = cellsProcessed;
  result.queried = snapshots.length;

  for (const snapshot of snapshots) {
    if (dryRun) {
      result.skipped += 1;
      result.places.push({
        placeId: snapshot.placeId,
        name: snapshot.name,
        action: "skipped",
        error: "dry_run",
      });
      continue;
    }
    const upsert = await upsertGoogleSalon(supabase, snapshot);
    tally(result, upsert);
  }

  return result;
}
