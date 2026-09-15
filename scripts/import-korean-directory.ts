/**
 * Match Brisbane Korean directory seeds to Google Places and upsert.
 *
 * Usage:
 *   npx tsx scripts/import-korean-directory.ts
 *   npx tsx scripts/import-korean-directory.ts --dry-run
 *   npx tsx scripts/import-korean-directory.ts --category restaurant
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
  const category = arg("category");

  const { createServiceSupabase } = await import(
    "../src/lib/supabase/service"
  );
  const { runKoreanDirectoryMatch } = await import(
    "../src/features/google-import/run-korean-directory-match"
  );

  const supabase = createServiceSupabase();
  const result = await runKoreanDirectoryMatch(supabase, {
    dryRun,
    categories: category ? [category] : undefined,
  });

  console.log(
    JSON.stringify(
      {
        queried: result.queried,
        matched: result.matched,
        inserted: result.inserted,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        byCategory: result.byCategory,
        unmatched: result.unmatched.slice(0, 30),
        sample: result.places.slice(0, 20),
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
