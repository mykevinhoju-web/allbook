import { after } from "next/server";
import { NextResponse } from "next/server";

import { runServiceEnrichmentBatch } from "@/features/service-enrichment";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Sequential salon service enrichment (Google tags + text/LLM drafts).
 * Auth: x-vercel-cron OR Bearer MAINTENANCE_TOKEN / CRON_SECRET.
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

  const batchSize = Number(
    body.batchSize ?? url.searchParams.get("batchSize") ?? 3,
  );
  const chain =
    body.chain !== false && url.searchParams.get("chain") !== "0";

  const supabase = createServiceSupabase();
  const result = await runServiceEnrichmentBatch(supabase, {
    batchSize: Number.isFinite(batchSize) ? batchSize : 3,
  });

  if (chain && !result.done) {
    const token =
      process.env.MAINTENANCE_TOKEN?.trim() ||
      process.env.CRON_SECRET?.trim();
    if (token) {
      const nextUrl = new URL(url.origin + url.pathname);
      nextUrl.searchParams.set("token", token);
      nextUrl.searchParams.set("batchSize", String(batchSize));
      nextUrl.searchParams.set("chain", "1");
      after(() => {
        void fetch(nextUrl.toString(), {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }).catch(() => undefined);
      });
    }
  }

  return NextResponse.json({
    ok: true,
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
