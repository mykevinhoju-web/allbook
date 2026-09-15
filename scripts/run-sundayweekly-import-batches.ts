/**
 * Batch-run Sunday Weekly Places matching against production.
 * Usage: npx tsx scripts/run-sundayweekly-import-batches.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      let value = t.slice(eq + 1).trim();
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

loadEnv();

const TOKEN =
  process.env.MAINTENANCE_TOKEN?.trim() ||
  (existsSync("tmp-maint-token.txt")
    ? readFileSync("tmp-maint-token.txt", "utf8").trim()
    : "");

if (!TOKEN) {
  console.error("MAINTENANCE_TOKEN missing");
  process.exit(1);
}

const seeds = JSON.parse(
  readFileSync(
    "src/features/google-import/data/sundayweekly-qld-directory-seeds.json",
    "utf8",
  ),
) as { counts: Record<string, number> };

const BATCH = 35;
const categories = Object.keys(seeds.counts);

async function runBatch(category: string, offset: number) {
  const body = {
    seedBundle: "sundayweekly",
    categories: [category],
    limit: BATCH,
    offset,
  };
  const res = await fetch(
    "https://allbook.com.au/api/platform/import/korean-directory",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const json = (await res.json()) as {
    error?: string;
    queried?: number;
    matched?: number;
    inserted?: number;
    updated?: number;
    failed?: number;
    unmatched?: unknown[];
  };
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}

async function main() {
  const summary: Array<Record<string, unknown>> = [];
  for (const category of categories) {
    const total = seeds.counts[category] ?? 0;
    for (let offset = 0; offset < total; offset += BATCH) {
      console.log(`\n>>> ${category} offset=${offset}/${total}`);
      try {
        const r = await runBatch(category, offset);
        console.log(
          JSON.stringify({
            category,
            offset,
            queried: r.queried,
            matched: r.matched,
            inserted: r.inserted,
            updated: r.updated,
            failed: r.failed,
            unmatched: r.unmatched?.length ?? 0,
          }),
        );
        summary.push({
          category,
          offset,
          matched: r.matched,
          inserted: r.inserted,
          updated: r.updated,
          failed: r.failed,
          unmatched: r.unmatched?.length ?? 0,
        });
      } catch (err) {
        console.error(`FAIL ${category}@${offset}:`, err);
        summary.push({
          category,
          offset,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
