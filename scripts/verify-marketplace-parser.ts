/**
 * Demo parser + NL → matching tests (no AI).
 * Sample queries are Australian English (canonical for AU market).
 *
 * Run: npx tsx scripts/verify-marketplace-parser.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  DemoRequestParser,
  matchPartners,
  normalizeCatalogPartner,
} from "../src/features/marketplace-matching";
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

loadEnvLocal();

const parser = new DemoRequestParser();

// Fixed "now" = Sunday 2026-08-09 → tomorrow Monday (lawn-friendly)
const NOW = new Date("2026-08-09T12:00:00+10:00");

function names(matches: { partner: { displayName: string } }[]) {
  return matches.map((m) => m.partner.displayName);
}

async function loadDemoPartners() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing supabase env");
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc(
    "load_marketplace_matching_catalog",
  );
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : [])
    .map((row) =>
      normalizeCatalogPartner(row as unknown as Record<string, unknown>),
    )
    .filter((p) => p.isDemo);
}

async function runCase(
  label: string,
  query: string,
  expected: string[],
  partners: Awaited<ReturnType<typeof loadDemoPartners>>,
) {
  const parsed = parser.parse(query, NOW);
  assert.equal(parsed.ok, true, `${label}: parse failed`);
  if (!parsed.ok) return;
  const result = matchPartners({
    request: parsed.request,
    partners,
  });
  assert.deepEqual(
    names(result.matches),
    expected,
    `${label}: got ${names(result.matches).join(", ") || "(none)"}`,
  );
  console.log(`PASS ${label} → ${expected.join(", ") || "(none)"}`);
}

async function main() {
  {
    const parsed = parser.parse(
      "I need someone tomorrow at 2pm in Aspley to mow my lawn for under $80.",
      NOW,
    );
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.request.serviceSlug, "lawn_mowing");
      assert.equal(parsed.request.serviceCategory, "lawn_care");
      assert.equal(parsed.request.locationLabel, "Aspley");
      assert.equal(parsed.request.preferredTime, "14:00");
      assert.equal(parsed.request.budgetCentsMax, 8000);
      assert.equal(parsed.request.preferredDay, 1);
    }
    console.log("PASS parser TEST1 structure (AU English)");
  }

  const partners = await loadDemoPartners();
  assert.ok(partners.length >= 5);

  await runCase(
    "TEST1 lawn Aspley under $80",
    "I need someone tomorrow at 2pm in Aspley to mow my lawn for under $80.",
    ["Green Grass AU", "John's Lawn Care"],
    partners,
  );

  await runCase(
    "TEST2 cleaning under $80",
    "I need house cleaning in Aspley for under $80.",
    [],
    partners,
  );

  await runCase(
    "TEST3 nail Chermside under $30",
    "Looking for a nail service in Chermside for under $30.",
    ["Sarah Beauty"],
    partners,
  );

  await runCase(
    "TEST4 car wash Saturday",
    "I want a car wash in Aspley on Saturday at 2pm for under $70.",
    ["Brisbane Mobile Auto"],
    partners,
  );

  await runCase(
    "TEST5 lawn Chermside",
    "I need lawn mowing in Chermside for under $80.",
    [],
    partners,
  );

  console.log("verify-marketplace-parser: all assertions passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
