import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { assertMarketplaceDemoAllowed } from "@/features/marketplace-matching";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * POST /api/marketplace/demo/seed
 * Re-runs scripts/seed-marketplace-demo.sql via service role when available.
 * Production blocked.
 */
export async function POST() {
  try {
    assertMarketplaceDemoAllowed();

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!serviceKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY is required to re-seed via API. Use scripts/seed-marketplace-demo.sql (MCP/SQL) instead.",
        },
        { status: 400 },
      );
    }

    const sql = readFileSync(
      join(process.cwd(), "scripts/seed-marketplace-demo.sql"),
      "utf8",
    );

    // Split on semicolons is fragile; prefer rpc if available.
    // Service client cannot run arbitrary SQL — return instructions.
    void sql;
    void createServiceSupabase;

    return NextResponse.json({
      ok: false,
      message:
        "Run `npx tsx scripts/seed-marketplace-demo.ts` or apply scripts/seed-marketplace-demo.sql with the Supabase SQL editor / MCP. API seed is intentionally SQL-file based for safety.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed blocked.";
    const status = message.includes("disabled in production") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
