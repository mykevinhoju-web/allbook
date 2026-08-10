import { NextResponse } from "next/server";

import { patchManagedBusiness } from "@/features/marketplace-admin";
import type { BusinessManageStatus } from "@/features/marketplace-admin";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

const STATUSES: BusinessManageStatus[] = [
  "pending",
  "approved",
  "rejected",
  "duplicate",
  "hidden",
];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requirePlatformAdmin();
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Business id required." }, { status: 400 });
    }

    const body = (await request.json()) as {
      bookingEnabled?: boolean;
      marketplaceVisible?: boolean;
      reviewStatus?: BusinessManageStatus;
      verified?: boolean;
      ownerKeywordLimit?: number;
      searchPriority?: number;
      ownershipStatus?:
        | "unclaimed"
        | "pending_verification"
        | "verified"
        | "rejected";
    };

    if (
      body.reviewStatus != null &&
      !STATUSES.includes(body.reviewStatus)
    ) {
      return NextResponse.json({ error: "Invalid reviewStatus." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const result = await patchManagedBusiness(supabase, {
      salonId: id,
      actor: user.email ?? user.id,
      patch: {
        bookingEnabled: body.bookingEnabled,
        marketplaceVisible: body.marketplaceVisible,
        reviewStatus: body.reviewStatus,
        verified: body.verified,
        ownerKeywordLimit: body.ownerKeywordLimit,
        searchPriority: body.searchPriority,
        ownershipStatus: body.ownershipStatus,
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ business: result.business });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update business.",
      },
      { status: 400 },
    );
  }
}
