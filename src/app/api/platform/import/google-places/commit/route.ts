import { NextResponse } from "next/server";

import { importSelectedGooglePlaces } from "@/features/google-import";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();

    const body = (await request.json()) as {
      placeIds?: string[];
      category?: string;
      country?: string;
      state?: string;
      city?: string;
    };

    if (!body.category?.trim() || !body.country?.trim()) {
      return NextResponse.json(
        { error: "country and category are required." },
        { status: 400 },
      );
    }
    if (!Array.isArray(body.placeIds) || body.placeIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one business to import." },
        { status: 400 },
      );
    }
    if (body.placeIds.length > 50) {
      return NextResponse.json(
        { error: "Import at most 50 businesses per batch." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const result = await importSelectedGooglePlaces(supabase, {
      placeIds: body.placeIds,
      category: body.category.trim(),
      country: body.country.trim(),
      state: body.state?.trim(),
      city: body.city?.trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Import failed.",
      },
      { status: 400 },
    );
  }
}
