import { NextResponse } from "next/server";

import {
  ensureDefaultBookingPolicy,
  updateSalonBookingPolicy,
} from "@/features/booking-policy";
import type { SalonBookingPolicyInput } from "@/features/booking-policy/types";
import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const owner = await requireOwnerSalon("/platform/salon/settings");
    const supabase = createServiceSupabase();
    const policy = await ensureDefaultBookingPolicy(supabase, owner.salon.id);
    return NextResponse.json({ policy });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load policy.",
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
      input?: SalonBookingPolicyInput;
    };
    if (body.salonId && body.salonId !== owner.salon.id) {
      return NextResponse.json({ error: "Salon mismatch." }, { status: 403 });
    }
    if (!body.input) {
      return NextResponse.json({ error: "input is required." }, { status: 400 });
    }
    const supabase = createServiceSupabase();
    const policy = await updateSalonBookingPolicy(
      supabase,
      owner.salon.id,
      body.input,
    );
    return NextResponse.json({ policy });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save policy.",
      },
      { status: 400 },
    );
  }
}
