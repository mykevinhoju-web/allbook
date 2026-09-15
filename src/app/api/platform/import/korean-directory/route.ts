import { NextResponse } from "next/server";

import { runKoreanDirectoryMatch } from "@/features/google-import/run-korean-directory-match";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Match QLDVision Brisbane directory seeds → Google Places → salons upsert.
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

    const body = (await request.json().catch(() => ({}))) as {
      categories?: string[];
      dryRun?: boolean;
      maxPhotos?: number;
    };

    const supabase = createServiceSupabase();
    const result = await runKoreanDirectoryMatch(supabase, {
      categories: body.categories,
      dryRun: body.dryRun,
      maxPhotos: body.maxPhotos,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Korean directory match failed.",
      },
      { status: 400 },
    );
  }
}
