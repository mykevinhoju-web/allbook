import { NextResponse } from "next/server";

import {
  runKoreanDirectoryMatch,
  type KoreanDirectorySeedBundle,
} from "@/features/google-import/run-korean-directory-match";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Match directory seeds → Google Places → salons upsert.
 * Auth: platform admin session OR Bearer MAINTENANCE_TOKEN.
 *
 * body:
 *  - seedBundle: qldvision | sundayweekly (default qldvision)
 *  - categories: string[]
 *  - limit / offset: batching for large seed files
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
      seedBundle?: KoreanDirectorySeedBundle;
      categories?: string[];
      dryRun?: boolean;
      maxPhotos?: number;
      limit?: number;
      offset?: number;
    };

    const supabase = createServiceSupabase();
    const result = await runKoreanDirectoryMatch(supabase, {
      seedBundle: body.seedBundle ?? "qldvision",
      categories: body.categories,
      dryRun: body.dryRun,
      maxPhotos: body.maxPhotos,
      limit: body.limit,
      offset: body.offset,
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
