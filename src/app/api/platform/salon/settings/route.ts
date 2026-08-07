import { NextResponse } from "next/server";

import {
  ensureDefaultSalonSettings,
  isSettingsGroupKey,
  resolveSalonSettings,
  upsertSalonSetting,
} from "@/features/business-settings";
import type { SettingsGroupKey } from "@/features/business-settings/types";
import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const owner = await requireOwnerSalon("/platform/salon/settings");
    const { searchParams } = new URL(request.url);
    const groupParam = searchParams.get("group") ?? "business";
    if (!isSettingsGroupKey(groupParam)) {
      return NextResponse.json({ error: "Invalid group." }, { status: 400 });
    }
    const supabase = createServiceSupabase();
    await ensureDefaultSalonSettings(supabase, owner.salon.id);
    const settings = await resolveSalonSettings(supabase, {
      salonId: owner.salon.id,
      group: groupParam,
      serviceId: searchParams.get("serviceId"),
      staffId: searchParams.get("staffId"),
      role: "owner",
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load settings.",
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
      group?: SettingsGroupKey;
      values?: Record<string, unknown>;
    };
    if (body.salonId && body.salonId !== owner.salon.id) {
      return NextResponse.json({ error: "Salon mismatch." }, { status: 403 });
    }
    if (!body.group || !isSettingsGroupKey(body.group)) {
      return NextResponse.json({ error: "Invalid group." }, { status: 400 });
    }
    if (!body.values || typeof body.values !== "object") {
      return NextResponse.json({ error: "values required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    for (const [key, value] of Object.entries(body.values)) {
      await upsertSalonSetting(supabase, {
        salonId: owner.salon.id,
        group: body.group,
        key,
        value,
        role: "owner",
        actor: owner.owner.email ?? "owner",
      });
    }

    const settings = await resolveSalonSettings(supabase, {
      salonId: owner.salon.id,
      group: body.group,
      role: "owner",
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save settings.",
      },
      { status: 400 },
    );
  }
}
