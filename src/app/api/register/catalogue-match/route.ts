import { NextResponse } from "next/server";

import {
  findCatalogueMatches,
  hardCatalogueMatches,
} from "@/features/salon-registration/catalogue-match";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Public registration helper: detect catalogue overlaps before creating a salon.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      businessName?: string;
      phone?: string;
      address?: string;
      suburb?: string;
      postcode?: string;
      website?: string;
      googlePlaceId?: string;
    };

    const supabase = createServiceSupabase();
    const matches = await findCatalogueMatches(supabase, body);
    const hard = hardCatalogueMatches(matches);

    return NextResponse.json({
      matches,
      hardMatches: hard,
      blocked: hard.length > 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not check catalogue.",
      },
      { status: 400 },
    );
  }
}
