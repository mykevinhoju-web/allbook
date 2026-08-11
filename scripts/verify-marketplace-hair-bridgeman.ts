/**
 * Bridgeman Downs hair marketplace matching tests (AU English).
 * Run: npx tsx scripts/verify-marketplace-hair-bridgeman.ts
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
const NOW = new Date("2026-08-09T12:00:00+10:00"); // Sun → tomorrow Mon

function names(matches: { partner: { displayName: string } }[]) {
  return matches.map((m) => m.partner.displayName);
}

async function main() {
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
  const partners = (Array.isArray(data) ? data : [])
    .map((row) =>
      normalizeCatalogPartner(row as unknown as Record<string, unknown>),
    )
    .filter((p) =>
      ["ABC Hair", "BBC Hair", "CCC Hair"].includes(p.displayName),
    );

  assert.equal(partners.length, 3, `expected 3 hair partners, got ${partners.length}`);
  for (const p of partners) {
    assert.ok(p.latitude != null && p.longitude != null, `${p.displayName} needs coords`);
    assert.ok(p.amenities.length === 1, `${p.displayName} needs one amenity`);
  }

  const all = parser.parse(
    "I need a haircut in Bridgeman Downs tomorrow at 2pm.",
    NOW,
  );
  assert.equal(all.ok, true);
  if (all.ok) {
    const result = matchPartners({ request: all.request, partners });
    assert.deepEqual(names(result.matches).sort(), [
      "ABC Hair",
      "BBC Hair",
      "CCC Hair",
    ].sort());
    // cheapest first among equal hard filters → ABC $45
    assert.equal(result.matches[0].partner.displayName, "ABC Hair");
    console.log("PASS all Bridgeman haircuts → ABC, BBC, CCC");
  }

  const disability = parser.parse(
    "Looking for a disability accessible haircut in Bridgeman Downs.",
    NOW,
  );
  assert.equal(disability.ok, true);
  if (disability.ok) {
    const result = matchPartners({ request: disability.request, partners });
    assert.deepEqual(names(result.matches), ["ABC Hair"]);
    console.log("PASS disability → ABC Hair");
  }

  const kids = parser.parse(
    "Haircut in Bridgeman Downs with kids care.",
    NOW,
  );
  assert.equal(kids.ok, true);
  if (kids.ok) {
    const result = matchPartners({ request: kids.request, partners });
    assert.deepEqual(names(result.matches), ["BBC Hair"]);
    console.log("PASS kids care → BBC Hair");
  }

  const parking = parser.parse(
    "I need a haircut in Bridgeman Downs with parking.",
    NOW,
  );
  assert.equal(parking.ok, true);
  if (parking.ok) {
    const result = matchPartners({ request: parking.request, partners });
    assert.deepEqual(names(result.matches), ["CCC Hair"]);
    console.log("PASS parking → CCC Hair");
  }

  console.log("verify-marketplace-hair-bridgeman: all assertions passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
