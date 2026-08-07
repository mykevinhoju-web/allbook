import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  buildTextQuery,
  resolvePlacesCategoryMapping,
} from "./category-map";
import { mapPlaceToSnapshot } from "./map-place";
import {
  geocodeImportCenter,
  searchTextPlaces,
  sleep,
} from "./places-client";
import type {
  GoogleImportOptions,
  GoogleImportRunResult,
  GoogleImportTarget,
} from "./types";
import { upsertGoogleSalon } from "./upsert-google-salon";

type AnySupabase = SupabaseClient<Database>;

/**
 * Production Google → AllBook discovery import.
 * Does not touch ranking, booking, or marketplace search URLs.
 */
export async function runGoogleBusinessImport(
  supabase: AnySupabase,
  target: GoogleImportTarget,
  options: GoogleImportOptions = {},
): Promise<GoogleImportRunResult> {
  const maxPages = Math.max(1, options.maxPages ?? 5);
  const pageSize = Math.min(20, Math.max(1, options.pageSize ?? 20));
  const maxPhotos = Math.max(0, options.maxPhotos ?? 4);
  const biasRadiusMeters = options.biasRadiusMeters ?? 25_000;
  const dryRun = options.dryRun ?? false;

  const mapping = resolvePlacesCategoryMapping(target.category);
  const textQuery = buildTextQuery({
    textNoun: mapping.textNoun,
    city: target.city,
    state: target.state,
    country: target.country,
  });

  const center = await geocodeImportCenter({
    city: target.city,
    state: target.state,
    country: target.country,
  });

  const result: GoogleImportRunResult = {
    target,
    queried: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    places: [],
  };

  let pageToken: string | null = null;
  const seen = new Set<string>();

  for (let page = 0; page < maxPages; page += 1) {
    const response = await searchTextPlaces({
      textQuery,
      includedType: mapping.includedType,
      pageSize,
      pageToken,
      regionCode: /australia/i.test(target.country) ? "AU" : undefined,
      locationBias: center
        ? { center, radiusMeters: biasRadiusMeters }
        : undefined,
    });

    for (const place of response.places) {
      const snapshot = mapPlaceToSnapshot(
        place,
        mapping,
        {
          city: target.city,
          state: target.state,
          country: target.country,
        },
        maxPhotos,
      );
      if (!snapshot) {
        result.skipped += 1;
        result.places.push({
          placeId: place.id ?? "unknown",
          name: place.displayName?.text ?? "Unknown",
          action: "skipped",
          error: "Incomplete place payload",
        });
        continue;
      }
      if (seen.has(snapshot.placeId)) {
        result.skipped += 1;
        continue;
      }
      seen.add(snapshot.placeId);
      result.queried += 1;

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
      result.places.push(upsert);
      if (upsert.error) {
        result.errors.push(`${upsert.name}: ${upsert.error}`);
        result.skipped += 1;
      } else if (upsert.action === "inserted") {
        result.inserted += 1;
      } else if (upsert.action === "updated") {
        result.updated += 1;
      } else {
        result.skipped += 1;
      }
    }

    pageToken = response.nextPageToken;
    if (!pageToken) break;
    // Gentle pacing between Google pages
    await sleep(350);
  }

  return result;
}
