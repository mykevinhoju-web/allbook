import { NextResponse } from "next/server";

import {
  updateBusiness,
  type BusinessProfileInput,
} from "@/features/business";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      salonId?: string;
      input?: BusinessProfileInput;
      allowFeatured?: boolean;
    };

    if (!body.salonId || !body.input) {
      return NextResponse.json(
        { error: "salonId and input are required." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const result = await updateBusiness(supabase, body.salonId, body.input, {
      allowFeatured: Boolean(body.allowFeatured),
    });

    if (result.error || !result.business) {
      return NextResponse.json(
        { error: result.error || "Update failed." },
        { status: 400 },
      );
    }

    return NextResponse.json({ business: result.business });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update business.",
      },
      { status: 500 },
    );
  }
}
