import { after } from "next/server";
import { NextResponse } from "next/server";

import {
  BRISBANE_SUBURB_FILL_CATEGORIES,
  runBrisbaneSuburbFillBatch,
} from "@/features/search/brisbane-suburb-fill";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Sequential Greater Brisbane suburb Places fill.
 * Auth: Vercel Cron header, or Bearer/query MAINTENANCE_TOKEN / CRON_SECRET.
 *
 * Query/body:
 *   category=hair | categories=hair,nails,spa
 *   radiusKm=8
 *   batchSize=6
 *   force=1
 *   chain=1 (default) — continue next batch in the background when remaining > 0
 */
function authorized(request: Request): boolean {
  if (request.headers.has("x-vercel-cron")) return true;

  const url = new URL(request.url);
  const bearer = request.headers.get("authorization") ?? "";
  const queryToken = url.searchParams.get("token") ?? "";
  const candidates = [
    process.env.MAINTENANCE_TOKEN?.trim(),
    process.env.CRON_SECRET?.trim(),
  ].filter(Boolean) as string[];

  for (const expected of candidates) {
    if (bearer === `Bearer ${expected}`) return true;
    if (queryToken && queryToken === expected) return true;
  }
  return false;
}

function parseCategories(
  searchParams: URLSearchParams,
  body: Record<string, unknown>,
): string[] {
  const fromBodyList = Array.isArray(body.categories)
    ? body.categories.map(String)
    : typeof body.categories === "string"
      ? body.categories.split(",")
      : [];
  const fromQuery = (searchParams.get("categories") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single =
    (typeof body.category === "string" && body.category) ||
    searchParams.get("category") ||
    "";
  const merged = [...fromBodyList, ...fromQuery, ...(single ? [single] : [])];
  return merged.length > 0 ? merged : ["hair"];
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  let body: Record<string, unknown> = {};
  if (request.method !== "GET") {
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  const categories = parseCategories(url.searchParams, body);
  const radiusKm = Number(
    body.radiusKm ?? url.searchParams.get("radiusKm") ?? 8,
  );
  const batchSize = Number(
    body.batchSize ?? url.searchParams.get("batchSize") ?? 6,
  );
  const force =
    body.force === true ||
    body.force === 1 ||
    url.searchParams.get("force") === "1";
  const chain =
    body.chain !== false &&
    url.searchParams.get("chain") !== "0";

  const supabase = createServiceSupabase();
  const result = await runBrisbaneSuburbFillBatch(supabase, {
    categories,
    radiusKm: Number.isFinite(radiusKm) ? radiusKm : 8,
    batchSize: Number.isFinite(batchSize) ? batchSize : 6,
    force,
  });

  // Keep walking the catalogue without waiting for the next cron tick.
  if (chain && !result.done) {
    const token =
      process.env.MAINTENANCE_TOKEN?.trim() ||
      process.env.CRON_SECRET?.trim();
    if (token) {
      const nextUrl = new URL(url.origin + url.pathname);
      nextUrl.searchParams.set("token", token);
      nextUrl.searchParams.set("categories", categories.join(","));
      nextUrl.searchParams.set("radiusKm", String(result.radiusKm));
      nextUrl.searchParams.set("batchSize", String(batchSize));
      if (force) nextUrl.searchParams.set("force", "1");
      nextUrl.searchParams.set("chain", "1");

      after(() => {
        void fetch(nextUrl.toString(), {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }).catch(() => {
          /* next cron tick will resume */
        });
      });
    }
  }

  return NextResponse.json({
    ok: true,
    supportedCategories: BRISBANE_SUBURB_FILL_CATEGORIES,
    chaining: chain && !result.done,
    result,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
