import { NextResponse } from "next/server";

import { listPartnersForAdmin } from "@/features/marketplace-partner";
import type { PartnerStatus, PartnerType } from "@/features/marketplace-partner";
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
    const status = (searchParams.get("status") ?? "all") as PartnerStatus | "all";
    const partnerType = (searchParams.get("partnerType") ??
      "all") as PartnerType | "all";

    const supabase = createServiceSupabase();
    const result = await listPartnersForAdmin({
      supabase,
      q: searchParams.get("q") ?? "",
      status,
      partnerType,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 40),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed." },
      { status: 400 },
    );
  }
}
