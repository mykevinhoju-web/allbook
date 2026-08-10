/**
 * Fill marketplace salons from Google Places for every Greater Brisbane suburb.
 *
 * Usage:
 *   npx tsx scripts/fill-brisbane-suburbs-from-google.ts --category hair
 *   npx tsx scripts/fill-brisbane-suburbs-from-google.ts --category hair --radius-km 8 --limit 5
 *   npx tsx scripts/fill-brisbane-suburbs-from-google.ts --category hair --offset 20
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY / NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFiles() {
  for (const file of [".env.local", ".env.vercel.tmp", ".env"]) {
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
      // Strip accidental wrapping quotes from `vercel env pull`
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      const existing = process.env[key];
      // Cursor may inject redacted "[SENSITIVE]" placeholders into the shell —
      // never prefer those over a real value from an env file.
      if (
        !existing ||
        existing === "[SENSITIVE]" ||
        existing.includes("SENSITIVE")
      ) {
        if (value && value !== "[SENSITIVE]") process.env[key] = value;
      }
    }
  }
}

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

loadEnvFiles();

async function main() {
  const category = arg("category", "hair")!;
  const radiusKm = Number(arg("radius-km", "8"));
  const delayMs = Number(arg("delay-ms", "500"));
  const offset = Math.max(0, Number(arg("offset", "0")));
  const limitRaw = arg("limit");
  const limit = limitRaw ? Math.max(1, Number(limitRaw)) : null;
  const force = flag("force");
  const dryRun = flag("dry-run");

  const { BRISBANE_SUBURBS } = await import(
    "../src/features/search/brisbane-suburbs"
  );
  const { createServiceSupabase } = await import(
    "../src/lib/supabase/service"
  );
  const {
    fillSearchAreaFromGoogle,
    buildSearchAreaKey,
    getSearchAreaCoverage,
    isSearchAreaStale,
  } = await import("../src/features/search/auto-google-import");

  const slice = BRISBANE_SUBURBS.slice(
    offset,
    limit == null ? undefined : offset + limit,
  );

  console.log(
    JSON.stringify(
      {
        starting: true,
        category,
        radiusKm,
        offset,
        limit,
        totalSuburbs: BRISBANE_SUBURBS.length,
        running: slice.length,
        force,
        dryRun,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log(slice.map((s) => s.name).join("\n"));
    return;
  }

  const supabase = createServiceSupabase();
  const totals = {
    suburbs: 0,
    skippedFresh: 0,
    queried: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < slice.length; i += 1) {
    const suburb = slice[i]!;
    const index = offset + i + 1;
    const locationLabel = `${suburb.name} QLD ${suburb.postcode}, Australia`;

    if (!force) {
      const areaKey = buildSearchAreaKey({
        categorySlug: category,
        latitude: suburb.latitude,
        longitude: suburb.longitude,
        radiusKm,
      });
      const coverage = await getSearchAreaCoverage(supabase, areaKey);
      if (
        coverage &&
        coverage.lastStatus === "ok" &&
        !coverage.resumePageToken &&
        !isSearchAreaStale(coverage.lastFetchedAt)
      ) {
        totals.skippedFresh += 1;
        console.log(
          `[${index}/${BRISBANE_SUBURBS.length}] skip fresh ${suburb.name}`,
        );
        continue;
      }
    }

    console.log(
      `[${index}/${BRISBANE_SUBURBS.length}] fill ${suburb.name} (${radiusKm}km)`,
    );

    const result = await fillSearchAreaFromGoogle(supabase, {
      category,
      locationLabel,
      latitude: suburb.latitude,
      longitude: suburb.longitude,
      radiusKm,
    });

    totals.suburbs += 1;
    totals.queried += result.queried;
    totals.imported += result.imported;
    totals.updated += result.updated;
    totals.skipped += result.skipped;
    totals.failed += result.failed;
    if (result.error) {
      totals.errors.push(`${suburb.name}: ${result.error}`);
    }

    console.log(
      JSON.stringify({
        suburb: suburb.name,
        status: result.status,
        queried: result.queried,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        pages: result.totalPages,
        remainingPages: result.remainingPages,
        error: result.error ?? null,
      }),
    );

    if (delayMs > 0 && i < slice.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.log(JSON.stringify({ done: true, totals }, null, 2));
  if (totals.failed > 0 && totals.imported + totals.updated === 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
