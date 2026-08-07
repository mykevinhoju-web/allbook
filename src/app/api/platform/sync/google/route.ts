import { NextResponse } from "next/server";

import {
  createGoogleSyncRun,
  processGoogleSyncRunToCompletion,
} from "@/features/google-sync";
import type { GoogleSyncScope } from "@/features/google-sync/types";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Create a Google sync run (queue). Optionally process to completion for small jobs.
 * Auth: platform admin.
 */
export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = (await request.json()) as {
      scope?: GoogleSyncScope;
      country?: string;
      state?: string;
      city?: string;
      salonId?: string;
      processNow?: boolean;
      batchSize?: number;
    };

    const scope = body.scope ?? "city";
    const supabase = createServiceSupabase();
    const run = await createGoogleSyncRun(
      supabase,
      {
        scope,
        country: body.country ?? "Australia",
        state: body.state,
        city: body.city,
        salonId: body.salonId,
      },
      "admin",
    );

    if (body.processNow) {
      const completed = await processGoogleSyncRunToCompletion(
        supabase,
        run.id,
        { batchSize: body.batchSize ?? 10 },
      );
      return NextResponse.json({ run: completed });
    }

    return NextResponse.json({ run });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start sync.",
      },
      { status: 400 },
    );
  }
}
