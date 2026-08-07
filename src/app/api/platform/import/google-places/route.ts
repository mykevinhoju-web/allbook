import { NextResponse } from "next/server";

import { runGoogleBusinessImport } from "@/features/google-import";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Ops-only Google discovery import.
 * Auth: Authorization: Bearer <MAINTENANCE_TOKEN>
 * Does not change public marketplace URLs.
 */
export async function POST(request: Request) {
  const token = process.env.MAINTENANCE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "MAINTENANCE_TOKEN is not configured." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      country?: string;
      state?: string;
      city?: string;
      category?: string;
      maxPages?: number;
      pageSize?: number;
      dryRun?: boolean;
    };

    if (!body.country || !body.state || !body.city || !body.category) {
      return NextResponse.json(
        { error: "country, state, city, and category are required." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const result = await runGoogleBusinessImport(
      supabase,
      {
        country: body.country,
        state: body.state,
        city: body.city,
        category: body.category,
      },
      {
        maxPages: body.maxPages,
        pageSize: body.pageSize,
        dryRun: body.dryRun,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Google import failed.",
      },
      { status: 400 },
    );
  }
}
