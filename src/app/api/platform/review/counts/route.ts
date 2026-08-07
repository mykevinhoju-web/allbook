import { NextResponse } from "next/server";

import { getReviewQueueCounts } from "@/features/marketplace-review";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const supabase = createServiceSupabase();
    const counts = await getReviewQueueCounts(supabase);
    return NextResponse.json({ counts });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load counts.",
      },
      { status: 400 },
    );
  }
}
