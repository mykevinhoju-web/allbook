import { NextResponse } from "next/server";

import { listManagedBusinesses } from "@/features/marketplace-admin";
import type { BusinessManageStatus } from "@/features/marketplace-admin";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

const STATUSES: Array<BusinessManageStatus | "all"> = [
  "all",
  "pending",
  "approved",
  "rejected",
  "duplicate",
  "hidden",
];

export async function GET(request: Request) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(request.url);
    const reviewStatus = (searchParams.get("reviewStatus") ??
      "all") as BusinessManageStatus | "all";
    if (!STATUSES.includes(reviewStatus)) {
      return NextResponse.json({ error: "Invalid reviewStatus." }, { status: 400 });
    }

    const bookingRaw = searchParams.get("booking") ?? "all";
    const booking =
      bookingRaw === "on" || bookingRaw === "off" || bookingRaw === "all"
        ? bookingRaw
        : null;
    if (!booking) {
      return NextResponse.json({ error: "Invalid booking filter." }, { status: 400 });
    }

    const visibleRaw = searchParams.get("visible") ?? "all";
    const visible =
      visibleRaw === "yes" || visibleRaw === "no" || visibleRaw === "all"
        ? visibleRaw
        : null;
    if (!visible) {
      return NextResponse.json({ error: "Invalid visible filter." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const result = await listManagedBusinesses(supabase, {
      q: searchParams.get("q") ?? "",
      reviewStatus,
      booking,
      visible,
      source: searchParams.get("source") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 40),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list businesses.",
      },
      { status: 400 },
    );
  }
}
