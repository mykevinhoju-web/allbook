import { NextResponse } from "next/server";

import { listGoogleSyncHistory } from "@/features/google-sync";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "30");
    const supabase = createServiceSupabase();
    const runs = await listGoogleSyncHistory(
      supabase,
      Number.isFinite(limit) ? Math.min(100, Math.max(1, limit)) : 30,
    );
    return NextResponse.json({ runs });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load sync history.",
      },
      { status: 400 },
    );
  }
}
