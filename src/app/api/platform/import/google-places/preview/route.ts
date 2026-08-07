import { NextResponse } from "next/server";

import { previewGoogleBusinessImport } from "@/features/google-import";
import type {
  GoogleImportGeoScope,
  GoogleImportTarget,
} from "@/features/google-import/types";
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
      country?: string;
      state?: string;
      city?: string;
      suburb?: string;
      category?: string;
      scope?: GoogleImportGeoScope;
      maxPages?: number;
      pageSize?: number;
    };

    if (!body.country?.trim() || !body.category?.trim()) {
      return NextResponse.json(
        { error: "country and category are required." },
        { status: 400 },
      );
    }

    const scope = body.scope ?? "city";
    if (
      (scope === "suburb" || scope === "city" || scope === "state") &&
      !body.state?.trim()
    ) {
      return NextResponse.json(
        { error: "state is required for this scope." },
        { status: 400 },
      );
    }
    if ((scope === "suburb" || scope === "city") && !body.city?.trim() && !body.suburb?.trim()) {
      return NextResponse.json(
        { error: "city or suburb is required for this scope." },
        { status: 400 },
      );
    }

    const target: GoogleImportTarget = {
      country: body.country.trim(),
      state: body.state?.trim(),
      city: body.city?.trim() || body.suburb?.trim(),
      suburb: body.suburb?.trim(),
      category: body.category.trim(),
      scope,
    };

    const supabase = createServiceSupabase();
    const result = await previewGoogleBusinessImport(supabase, target, {
      maxPages: body.maxPages,
      pageSize: body.pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Preview failed.",
      },
      { status: 400 },
    );
  }
}
