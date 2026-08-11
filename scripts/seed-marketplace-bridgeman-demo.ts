/**
 * Apply Bridgeman DEMO seed via Supabase Management SQL (manual / CI helper).
 * Prefer: MCP execute_sql, or paste scripts/seed-marketplace-bridgeman-demo.sql
 * into the Supabase SQL editor.
 *
 * This script only prints chunk boundaries for operators — it does not auto-run
 * against production without an explicit SQL apply path.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sql = readFileSync(
  join(process.cwd(), "scripts/seed-marketplace-bridgeman-demo.sql"),
  "utf8",
);
console.log(`Seed SQL ready (${sql.length} chars).`);
console.log(
  "Apply with Supabase SQL editor / MCP execute_sql using scripts/seed-marketplace-bridgeman-demo.sql",
);
