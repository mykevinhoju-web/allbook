import { NextResponse } from "next/server";

import {
  getServicePolicyOverride,
  upsertServicePolicyOverride,
} from "@/features/booking-policy";
import type { ServicePolicyOverrideInput } from "@/features/booking-policy/types";
import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Params = { params: Promise<{ serviceId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const owner = await requireOwnerSalon("/platform/salon/settings");
    const { serviceId } = await params;
    const supabase = createServiceSupabase();
    const override = await getServicePolicyOverride(supabase, serviceId);
    if (override && override.salonId !== owner.salon.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ override });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load override.",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const owner = await requireOwnerSalon("/platform/salon/settings");
    const { serviceId } = await params;
    const body = (await request.json()) as {
      salonId?: string;
      input?: ServicePolicyOverrideInput;
    };
    if (body.salonId && body.salonId !== owner.salon.id) {
      return NextResponse.json({ error: "Salon mismatch." }, { status: 403 });
    }
    if (!body.input) {
      return NextResponse.json({ error: "input is required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data: service } = await supabase
      .from("salon_services")
      .select("id, salon_id")
      .eq("id", serviceId)
      .maybeSingle();
    if (!service || service.salon_id !== owner.salon.id) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }

    const override = await upsertServicePolicyOverride(
      supabase,
      owner.salon.id,
      serviceId,
      body.input,
    );
    return NextResponse.json({ override });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save override.",
      },
      { status: 400 },
    );
  }
}
