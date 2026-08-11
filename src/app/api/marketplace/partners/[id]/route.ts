import { NextResponse } from "next/server";

import {
  PartnerAuthError,
  requirePartnerOwner,
  updatePartnerProfile,
} from "@/features/marketplace-partner";
import type { UpdatePartnerProfileInput } from "@/features/marketplace-partner";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** PATCH: partner updates own profile (not status / identity). */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { partner, supabase } = await requirePartnerOwner(id);
    const body = (await request.json()) as UpdatePartnerProfileInput;
    const updated = await updatePartnerProfile({
      supabase,
      partnerId: partner.id,
      input: body,
    });
    return NextResponse.json({ partner: updated });
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
