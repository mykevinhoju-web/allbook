/**
 * Reset + seed Marketplace demo partners.
 *
 * Production protected: refuses when VERCEL_ENV=production.
 *
 * Usage:
 *   npx tsx scripts/seed-marketplace-demo.ts
 *
 * Apply SQL with Supabase SQL editor / MCP:
 *   scripts/seed-marketplace-demo.sql
 *
 * Then this script verifies demo partners are visible via catalog RPC.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { isMarketplaceDemoAllowed } from "../src/features/marketplace-matching/demo-guard";
import type { Database } from "../src/types/database";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  if (!isMarketplaceDemoAllowed()) {
    throw new Error("Refusing to seed Marketplace demo in production.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / anon key.");
  }

  const sqlPath = join(process.cwd(), "scripts/seed-marketplace-demo.sql");
  console.log(`Seed SQL file: ${sqlPath}`);
  console.log(
    "To reset+seed: apply that SQL in Supabase SQL editor / MCP, then re-run this script.",
  );

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("load_marketplace_matching_catalog");
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  const demoNames = rows
    .filter((r) => Boolean((r as { is_demo?: boolean }).is_demo))
    .map((r) => String((r as { display_name?: string }).display_name));

  console.log(`Active catalog size: ${rows.length}`);
  console.log(`Demo partners visible: ${demoNames.join(", ") || "(none)"}`);

  if (demoNames.length < 5) {
    console.log(
      "Demo partners incomplete. Apply scripts/seed-marketplace-demo.sql then re-run.",
    );
    process.exitCode = 2;
    return;
  }

  console.log("seed-marketplace-demo: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
