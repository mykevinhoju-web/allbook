import { NextResponse } from "next/server";

import { runGoogleBusinessImport } from "@/features/google-import";
import type { GoogleImportGeoScope } from "@/features/google-import/types";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Bulk discovery import (all results in scope).
 * Auth: platform admin session OR Bearer MAINTENANCE_TOKEN.
 */
export async function POST(request: Request) {
  try {
    const token = process.env.MAINTENANCE_TOKEN?.trim();
    const auth = request.headers.get("authorization") ?? "";
    const maintenanceOk = Boolean(token && auth === `Bearer ${token}`);

    if (!maintenanceOk) {
      await requirePlatformAdmin();
    }

    const body = (await request.json()) as {
      country?: string;
      state?: string;
      city?: string;
      suburb?: string;
      category?: string;
      scope?: GoogleImportGeoScope;
      maxPages?: number;
      pageSize?: number;
      dryRun?: boolean;
    };

    if (!body.country || !body.category) {
      return NextResponse.json(
        { error: "country and category are required." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const result = await runGoogleBusinessImport(
      supabase,
      {
        country: body.country,
        state: body.state,
        city: body.city || body.suburb,
        suburb: body.suburb,
        category: body.category,
        scope: body.scope ?? "city",
      },
      {
        maxPages: body.maxPages,
        pageSize: body.pageSize,
        dryRun: body.dryRun,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Google import failed.",
      },
      { status: 400 },
    );
  }
}
