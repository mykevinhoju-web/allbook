import { NextResponse } from "next/server";

import {
  listFeatureFlags,
  setFeatureFlag,
} from "@/features/business-settings";
import type { FeatureFlagKey } from "@/features/business-settings/types";
import { isFeatureFlagKey } from "@/features/business-settings/resolve";
import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const owner = await requireOwnerSalon("/platform/salon/settings");
    const supabase = createServiceSupabase();
    const flags = await listFeatureFlags(supabase, owner.salon.id);
    return NextResponse.json({ flags });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load flags.",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const owner = await requireOwnerSalon("/platform/salon/settings");
    const body = (await request.json()) as {
      salonId?: string;
      key?: string;
      enabled?: boolean;
      config?: Record<string, unknown>;
    };
    if (body.salonId && body.salonId !== owner.salon.id) {
      return NextResponse.json({ error: "Salon mismatch." }, { status: 403 });
    }
    if (!body.key || !isFeatureFlagKey(body.key)) {
      return NextResponse.json({ error: "Invalid flag key." }, { status: 400 });
    }
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled required." }, { status: 400 });
    }
    const supabase = createServiceSupabase();
    const flag = await setFeatureFlag(supabase, {
      salonId: owner.salon.id,
      key: body.key as FeatureFlagKey,
      enabled: body.enabled,
      config: body.config,
    });
    return NextResponse.json({ flag });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save flag.",
      },
      { status: 400 },
    );
  }
}
