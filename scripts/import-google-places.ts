/**
 * Import real businesses from Google Places into public.salons.
 *
 * Usage:
 *   npx tsx scripts/import-google-places.ts --city Brisbane --state Queensland --country Australia --category hair
 *   npx tsx scripts/import-google-places.ts --city Brisbane --category hair --max-pages 3 --dry-run
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) with Places API (New) enabled
 */

import { existsSync, readFileSync } from "node:fs";
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
      if (!process.env[key]) process.env[key] = value;
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
  const city = arg("city", "Brisbane");
  const state = arg("state", "Queensland");
  const country = arg("country", "Australia");
  const category = arg("category", "hair");
  const maxPages = Number(arg("max-pages", "5"));
  const pageSize = Number(arg("page-size", "20"));
  const dryRun = flag("dry-run");

  if (!city || !state || !country || !category) {
    console.error(
      "Required: --city --state --country --category (e.g. hair)",
    );
    process.exitCode = 1;
    return;
  }

  const { createServiceSupabase } = await import(
    "../src/lib/supabase/service"
  );
  const { runGoogleBusinessImport } = await import(
    "../src/features/google-import"
  );

  const supabase = createServiceSupabase();
  console.log(
    JSON.stringify(
      {
        starting: true,
        city,
        state,
        country,
        category,
        maxPages,
        pageSize,
        dryRun,
      },
      null,
      2,
    ),
  );

  const result = await runGoogleBusinessImport(
    supabase,
    { city, state, country, category },
    { maxPages, pageSize, dryRun },
  );

  console.log(
    JSON.stringify(
      {
        queried: result.queried,
        inserted: result.inserted,
        updated: result.updated,
        skipped: result.skipped,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 20),
        sample: result.places.slice(0, 10),
      },
      null,
      2,
    ),
  );

  if (!dryRun && result.inserted + result.updated === 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
