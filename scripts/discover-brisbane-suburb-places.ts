/**
 * Discover hair salons via Google Places for Brisbane suburbs.
 * Writes JSONL snapshots (no DB write) — for MCP/SQL upsert or later import.
 *
 *   npx tsx scripts/discover-brisbane-suburb-places.ts --category hair --radius-km 8
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      const existing = process.env[key];
      if (
        !existing ||
        existing === "[SENSITIVE]" ||
        existing.includes("SENSITIVE")
      ) {
        if (value && value !== "[SENSITIVE]") process.env[key] = value;
      }
    }
  }
  // Prefer browser Maps key from .env.local when shell placeholders win.
  for (const k of [
    "GOOGLE_PLACES_API_KEY",
    "GOOGLE_MAPS_API_KEY",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  ]) {
    if (process.env[k] === "[SENSITIVE]") delete process.env[k];
  }
}

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

loadEnvFiles();

async function main() {
  const category = arg("category", "hair")!;
  const radiusKm = Number(arg("radius-km", "8"));
  const delayMs = Number(arg("delay-ms", "350"));
  const offset = Math.max(0, Number(arg("offset", "0")));
  const limitRaw = arg("limit");
  const limit = limitRaw ? Math.max(1, Number(limitRaw)) : null;
  const maxPages = Math.max(1, Number(arg("max-pages", "3")));

  const outDir = resolve(process.cwd(), "tmp");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(
    outDir,
    `brisbane-${category}-places.jsonl`,
  );

  const { BRISBANE_SUBURBS } = await import(
    "../src/features/search/brisbane-suburbs"
  );
  const {
    buildTextQuery,
    resolvePlacesCategoryMapping,
  } = await import("../src/features/google-import/category-map");
  const { mapPlaceToSnapshot } = await import(
    "../src/features/google-import/map-place"
  );
  const { searchTextPlacesWithRetry, sleep } = await import(
    "../src/features/google-import/places-client"
  );

  const mapping = resolvePlacesCategoryMapping(category);
  const slice = BRISBANE_SUBURBS.slice(
    offset,
    limit == null ? undefined : offset + limit,
  );

  const seen = new Set<string>();
  let written = 0;
  const lines: string[] = [];

  // Resume: keep existing place ids
  if (existsSync(outPath) && offset > 0) {
    for (const line of readFileSync(outPath, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line) as { placeId?: string };
        if (row.placeId) seen.add(row.placeId);
        lines.push(line);
      } catch {
        /* skip */
      }
    }
  }

  console.log(
    JSON.stringify({
      starting: true,
      category,
      radiusKm,
      maxPages,
      suburbs: slice.length,
      alreadySeen: seen.size,
      outPath,
    }),
  );

  for (let i = 0; i < slice.length; i += 1) {
    const suburb = slice[i]!;
    const index = offset + i + 1;
    const locationName = suburb.name;
    const textQuery = buildTextQuery({
      textNoun: mapping.textNoun,
      city: `${locationName} QLD`,
      state: "Queensland",
      country: "Australia",
    });
    const radiusMeters = Math.min(50_000, Math.max(2_000, radiusKm * 1000));
    const maxDistanceKm = Math.max(radiusKm * 1.35, radiusKm + 2);

    console.log(
      `[${index}/${BRISBANE_SUBURBS.length}] ${suburb.name} — ${textQuery}`,
    );

    let pageToken: string | null = null;
    for (let page = 0; page < maxPages; page += 1) {
      const response = await searchTextPlacesWithRetry({
        textQuery,
        includedType: mapping.includedType,
        pageSize: 20,
        pageToken,
        regionCode: "AU",
        locationBias: {
          center: { lat: suburb.latitude, lng: suburb.longitude },
          radiusMeters,
        },
      });

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
        if (!snapshot || seen.has(snapshot.placeId)) continue;
        const distKm = Math.hypot(
          (snapshot.latitude - suburb.latitude) * 111.32,
          (snapshot.longitude - suburb.longitude) *
            111.32 *
            Math.max(Math.cos((suburb.latitude * Math.PI) / 180), 0.01),
        );
        if (distKm > maxDistanceKm) continue;
        seen.add(snapshot.placeId);
        lines.push(JSON.stringify(snapshot));
        written += 1;
      }

      pageToken = response.nextPageToken;
      if (!pageToken) break;
      await sleep(delayMs);
    }

    writeFileSync(outPath, lines.join("\n") + (lines.length ? "\n" : ""), "utf8");
    if (delayMs > 0) await sleep(delayMs);
  }

  console.log(
    JSON.stringify({
      done: true,
      uniquePlaces: seen.size,
      newlyWritten: written,
      outPath,
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
