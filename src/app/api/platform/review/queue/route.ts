import { NextResponse } from "next/server";

import { listReviewQueue } from "@/features/marketplace-review";
import type { ReviewQueueTab } from "@/features/marketplace-review/types";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

const TABS: ReviewQueueTab[] = [
  "newly_imported",
  "updated",
  "duplicates",
  "closed",
  "missing",
  "import_errors",
];

export async function GET(request: Request) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(request.url);
    const tab = (searchParams.get("tab") ?? "newly_imported") as ReviewQueueTab;
    if (!TABS.includes(tab)) {
      return NextResponse.json({ error: "Invalid tab." }, { status: 400 });
    }
    const supabase = createServiceSupabase();
    const result = await listReviewQueue(supabase, tab, {
      limit: Number(searchParams.get("limit") ?? 50),
      offset: Number(searchParams.get("offset") ?? 0),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load queue.",
      },
      { status: 400 },
    );
  }
}
