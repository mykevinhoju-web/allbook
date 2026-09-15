/**
 * Brisbane Korean business discovery (hair + restaurants).
 *
 * Usage:
 *   npx tsx scripts/import-brisbane-korean.ts
 *   npx tsx scripts/import-brisbane-korean.ts --dry-run
 *   npx tsx scripts/import-brisbane-korean.ts --max-pages 2
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY)
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
  const dryRun = flag("dry-run");
  const maxPages = Number(arg("max-pages", "3"));
  const pageSize = Number(arg("page-size", "20"));

  const { createServiceSupabase } = await import(
    "../src/lib/supabase/service"
  );
  const { runKoreanBusinessDiscovery } = await import(
    "../src/features/google-import/run-korean-discovery"
  );

  const supabase = createServiceSupabase();
  console.log(
    JSON.stringify(
      {
        starting: true,
        city: "Brisbane",
        maxPages,
        pageSize,
        dryRun,
      },
      null,
      2,
    ),
  );

  const result = await runKoreanBusinessDiscovery(supabase, {
    city: "Brisbane",
    state: "Queensland",
    country: "Australia",
    maxPages,
    pageSize,
    dryRun,
  });

  console.log(
    JSON.stringify(
      {
        cellsProcessed: result.cellsProcessed,
        queried: result.queried,
        inserted: result.inserted,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 20),
        sample: result.places.slice(0, 15),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
