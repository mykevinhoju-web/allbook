import { NextResponse } from "next/server";

import { getGoogleSyncRun } from "@/features/google-sync";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const supabase = createServiceSupabase();
    const detail = await getGoogleSyncRun(supabase, id);
    if (!detail) {
      return NextResponse.json({ error: "Sync run not found." }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load sync run.",
      },
      { status: 400 },
    );
  }
}
