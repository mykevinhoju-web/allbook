/**
 * Bridgeman Downs multi-category Marketplace DEMO validation (AU English).
 * Covers the 12 SEARCH examples + cross-category isolation.
 *
 * Run: npx tsx scripts/verify-marketplace-bridgeman-demo.ts
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
/** Monday — same-day lawn + weekday availability. */
const NOW = new Date("2026-08-10T10:00:00+10:00");

const BRIDGEMAN_NAMES = new Set([
  "ABC Hair",
  "BBC Hair",
  "CCC Hair",
  "ABC Nails",
  "BBC Nails",
  "CCC Nails",
  "ABC Lawn Care",
  "BBC Lawn Care",
  "CCC Lawn Care",
  "ABC Dog Grooming",
  "BBC Dog Grooming",
  "CCC Dog Grooming",
]);

function names(matches: { partner: { displayName: string } }[]) {
  return matches.map((m) => m.partner.displayName);
}

function run(
  query: string,
  partners: ReturnType<typeof normalizeCatalogPartner>[],
) {
  const parsed = parser.parse(query, NOW);
  assert.equal(parsed.ok, true, `parse failed: ${query}`);
  if (!parsed.ok) throw new Error("unreachable");
  return matchPartners({ request: parsed.request, partners });
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

  const allPartners = (Array.isArray(data) ? data : []).map((row) =>
    normalizeCatalogPartner(row as unknown as Record<string, unknown>),
  );
  const bridgeman = allPartners.filter((p) =>
    BRIDGEMAN_NAMES.has(p.displayName),
  );
  assert.equal(
    bridgeman.length,
    12,
    `expected 12 Bridgeman DEMO partners, got ${bridgeman.length}`,
  );

  for (const p of bridgeman) {
    assert.ok(p.isDemo, `${p.displayName} must be is_demo`);
    assert.ok(
      p.latitude != null && p.longitude != null,
      `${p.displayName} needs map coords`,
    );
    assert.ok(p.amenities.length >= 1, `${p.displayName} needs amenities`);
    assert.ok(p.services.length >= 1, `${p.displayName} needs services`);
    assert.ok(p.areas.length >= 1, `${p.displayName} needs service areas`);
    assert.ok(p.availability, `${p.displayName} needs availability`);
  }

  const cases: Array<{
    label: string;
    query: string;
    expected: string[];
  }> = [
    {
      label: "SEARCH 1",
      query: "I need a haircut in Bridgeman Downs under $40.",
      expected: ["ABC Hair"],
    },
    {
      label: "SEARCH 2",
      query: "I need a haircut in Bridgeman Downs for my child.",
      expected: ["BBC Hair"],
    },
    {
      label: "SEARCH 3",
      query:
        "I need a haircut in Bridgeman Downs and I need wheelchair access.",
      expected: ["ABC Hair"],
    },
    {
      label: "SEARCH 4",
      query: "I need a haircut in Bridgeman Downs with parking.",
      expected: ["CCC Hair"],
    },
    {
      label: "SEARCH 5",
      query: "I need a manicure in Bridgeman Downs under $45.",
      expected: ["ABC Nails", "BBC Nails"],
    },
    {
      label: "SEARCH 6",
      query: "I need a manicure in Bridgeman Downs with wheelchair access.",
      expected: ["ABC Nails"],
    },
    {
      label: "SEARCH 7",
      query: "I need lawn mowing in Bridgeman Downs under $80.",
      expected: ["ABC Lawn Care", "BBC Lawn Care"],
    },
    {
      label: "SEARCH 8",
      query: "I need someone to mow my lawn today.",
      expected: ["BBC Lawn Care"],
    },
    {
      label: "SEARCH 9",
      query: "I need dog grooming for a large dog in Bridgeman Downs.",
      expected: ["BBC Dog Grooming"],
    },
    {
      label: "SEARCH 10",
      query: "I need dog grooming for a small dog in Bridgeman Downs.",
      expected: ["ABC Dog Grooming"],
    },
    {
      label: "SEARCH 11",
      query: "I need someone to come to my home and groom my dog.",
      expected: ["CCC Dog Grooming"],
    },
    {
      label: "SEARCH 12",
      query: "I need dog grooming in Bridgeman Downs under $50.",
      expected: ["ABC Dog Grooming"],
    },
  ];

  for (const c of cases) {
    const result = run(c.query, allPartners);
    assert.deepEqual(
      names(result.matches).sort(),
      [...c.expected].sort(),
      `${c.label}: ${c.query}`,
    );
    // Map pins only for matches
    for (const m of result.matches) {
      assert.ok(m.partner.latitude != null && m.partner.longitude != null);
    }
    console.log(`PASS ${c.label} → ${c.expected.join(", ")}`);
  }

  // Cross-category isolation: hair request never returns lawn
  const hair = run(
    "I need a haircut in Bridgeman Downs under $40.",
    allPartners,
  );
  assert.ok(
    hair.matches.every((m) =>
      normalizeToken(m.service.categorySlug).includes("hair"),
    ),
  );
  assert.ok(
    !hair.matches.some((m) => /lawn/i.test(m.partner.displayName)),
    "Hair request must not return Lawn Care partners",
  );
  console.log("PASS cross-category: hair ≠ lawn");

  const dog = run(
    "I need dog grooming in Bridgeman Downs under $50.",
    allPartners,
  );
  assert.ok(
    !dog.matches.some((m) => /hair|nail|lawn/i.test(m.partner.displayName)),
  );
  console.log("PASS cross-category: dog ≠ hair/nail/lawn");

  // No-result: impossible budget
  const none = run(
    "I need a haircut in Bridgeman Downs under $10.",
    allPartners,
  );
  assert.equal(none.matches.length, 0);
  console.log("PASS no-result under $10 haircut");

  console.log("verify-marketplace-bridgeman-demo: all assertions passed");
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
