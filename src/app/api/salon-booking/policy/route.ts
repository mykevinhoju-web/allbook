import { NextResponse } from "next/server";

import { resolvePolicyForBooking } from "@/features/booking-policy";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Public resolver for customer booking summary.
 * Never charges — returns resolved policy text + amounts due (0 without gateway).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");
    const serviceId = searchParams.get("serviceId");
    const price = searchParams.get("price");
    if (!salonId) {
      return NextResponse.json({ error: "salonId is required." }, { status: 400 });
    }
    const supabase = createServiceSupabase();
    const policy = await resolvePolicyForBooking(supabase, {
      salonId,
      serviceId,
      servicePrice: price ? Number(price) : undefined,
    });
    return NextResponse.json({ policy });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to resolve policy.",
      },
      { status: 400 },
    );
  }
}
