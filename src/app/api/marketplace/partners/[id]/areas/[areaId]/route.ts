import { NextResponse } from "next/server";

import {
  deletePartnerArea,
  PartnerAuthError,
  requirePartnerOwner,
} from "@/features/marketplace-partner";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; areaId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, areaId } = await params;
    const { supabase } = await requirePartnerOwner(id);
    await deletePartnerArea({ supabase, partnerId: id, areaId });
    return NextResponse.json({ ok: true });
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
