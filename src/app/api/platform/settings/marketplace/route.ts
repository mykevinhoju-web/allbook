import { NextResponse } from "next/server";

import {
  getOwnerKeywordLimit,
  parseOwnerKeywordLimit,
  setOwnerKeywordLimit,
} from "@/features/business";
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
    const ownerKeywordLimit = await getOwnerKeywordLimit(supabase);
    return NextResponse.json({ ownerKeywordLimit });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = (await request.json()) as { ownerKeywordLimit?: number };
    if (body.ownerKeywordLimit == null) {
      return NextResponse.json(
        { error: "ownerKeywordLimit is required." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const result = await setOwnerKeywordLimit(
      supabase,
      parseOwnerKeywordLimit(body.ownerKeywordLimit),
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ownerKeywordLimit: result.limit });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }
}
