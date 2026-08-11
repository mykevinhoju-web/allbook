import { NextResponse } from "next/server";

import {
  getPartnerAvailability,
  PartnerAuthError,
  requirePartnerOwner,
  upsertPartnerAvailability,
} from "@/features/marketplace-partner";
import type { PartnerAvailabilityInput } from "@/features/marketplace-partner";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await requirePartnerOwner(id);
    const availability = await getPartnerAvailability({
      supabase,
      partnerId: id,
    });
    return NextResponse.json({ availability });
  } catch (error) {
    if (error instanceof PartnerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await requirePartnerOwner(id);
    const body = (await request.json()) as PartnerAvailabilityInput;
    const availability = await upsertPartnerAvailability({
      supabase,
      partnerId: id,
      input: body,
    });
    return NextResponse.json({ availability });
  } catch (error) {
    if (error instanceof PartnerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed." },
      { status: 400 },
    );
  }
}
