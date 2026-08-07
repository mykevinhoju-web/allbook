import { NextResponse } from "next/server";

import { runScheduledGoogleSync } from "@/features/google-sync";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Scheduled Google sync (city). Does not call Places at search time.
 * Auth: Bearer MAINTENANCE_TOKEN only.
 *
 * Body: { city, state, country?, processNow?, batchSize? }
 * Or query: ?city=Brisbane&state=Queensland
 */
export async function POST(request: Request) {
  const token = process.env.MAINTENANCE_TOKEN?.trim();
  const auth = request.headers.get("authorization") ?? "";
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    let body: {
      city?: string;
      state?: string;
      country?: string;
      processNow?: boolean;
      batchSize?: number;
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }

    const city = body.city || url.searchParams.get("city") || "";
    const state = body.state || url.searchParams.get("state") || "";
    if (!city || !state) {
      return NextResponse.json(
        { error: "city and state are required." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const run = await runScheduledGoogleSync(
      supabase,
      {
        city,
        state,
        country: body.country ?? "Australia",
      },
      {
        processNow: body.processNow !== false,
        batchSize: body.batchSize,
      },
    );

    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Scheduled Google sync failed.",
      },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
