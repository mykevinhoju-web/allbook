import { NextResponse } from "next/server";

import {
  runKoreanBusinessDiscovery,
  type KoreanDiscoveryPreset,
} from "@/features/google-import";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Brisbane Korean Places discovery (hair+restaurant, or incremental mart).
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
      maxPages?: number;
      pageSize?: number;
      dryRun?: boolean;
      preset?: KoreanDiscoveryPreset;
      queries?: Array<{
        textQuery: string;
        category: string;
        includedType?: string;
      }>;
    };

    const supabase = createServiceSupabase();
    const result = await runKoreanBusinessDiscovery(supabase, {
      city: "Brisbane",
      state: "Queensland",
      country: "Australia",
      maxPages: body.maxPages ?? 2,
      pageSize: body.pageSize ?? 20,
      dryRun: body.dryRun,
      preset: body.preset ?? "hair-restaurant",
      queries: body.queries,
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
            : "Korean Brisbane import failed.",
      },
      { status: 400 },
    );
  }
}
