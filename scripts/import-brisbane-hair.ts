/**
 * @deprecated Synthetic Brisbane hair seed — not for production catalogs.
 * Use Google Places discovery import instead:
 *   npm run import:google-places -- --city Brisbane --state Queensland --country Australia --category hair
 *
 * Legacy usage:
 *   npx tsx scripts/import-brisbane-hair.ts
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

loadEnvFiles();

async function main() {
  const { importSalons } = await import("../src/features/salon/importSalons");
  const { brisbaneHairSalons } = await import("../src/lib/seeds/brisbaneHair");
  const { createServiceSupabase } = await import(
    "../src/lib/supabase/service"
  );

  const supabase = createServiceSupabase();
  console.log(`Importing ${brisbaneHairSalons.length} Brisbane hair salons…`);

  const result = await importSalons(supabase, brisbaneHairSalons);

  console.log(
    JSON.stringify(
      {
        inserted: result.inserted,
        updated: result.updated,
        skipped: result.skipped,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 20),
      },
      null,
      2,
    ),
  );

  if (result.errors.length > 20) {
    console.log(`…and ${result.errors.length - 20} more errors`);
  }

  if (result.inserted + result.updated === 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
