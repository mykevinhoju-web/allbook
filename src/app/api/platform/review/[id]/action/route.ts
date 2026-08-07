import { NextResponse } from "next/server";

import {
  applyReviewAction,
  getBusinessReviewDetail,
} from "@/features/marketplace-review";
import type { ReviewAction } from "@/features/marketplace-review/types";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

const ACTIONS: ReviewAction[] = [
  "approve",
  "reject",
  "hide",
  "restore",
  "mark_duplicate",
  "permanently_closed",
  "re_sync",
  "merge",
];

export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requirePlatformAdmin();
    const { id } = await params;
    const body = (await request.json()) as {
      action?: ReviewAction;
      duplicateOfSalonId?: string;
      mergeIntoSalonId?: string;
      note?: string;
    };

    if (!body.action || !ACTIONS.includes(body.action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const result = await applyReviewAction(supabase, {
      salonId: id,
      action: body.action,
      actor: admin.email || admin.id || "admin",
      duplicateOfSalonId: body.duplicateOfSalonId,
      mergeIntoSalonId: body.mergeIntoSalonId,
      note: body.note,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const detailSalonId =
      body.action === "merge" && body.mergeIntoSalonId
        ? body.mergeIntoSalonId
        : id;
    const detail = await getBusinessReviewDetail(supabase, detailSalonId);
    return NextResponse.json({ ok: true, detail });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Action failed.",
      },
      { status: 400 },
    );
  }
}
