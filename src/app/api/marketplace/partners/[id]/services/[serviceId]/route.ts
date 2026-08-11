import { NextResponse } from "next/server";

import {
  deletePartnerService,
  PartnerAuthError,
  requirePartnerOwner,
  updatePartnerService,
} from "@/features/marketplace-partner";
import type { PartnerServiceInput } from "@/features/marketplace-partner";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; serviceId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, serviceId } = await params;
    const { supabase } = await requirePartnerOwner(id);
    const body = (await request.json()) as PartnerServiceInput;
    const service = await updatePartnerService({
      supabase,
      partnerId: id,
      serviceId,
      input: body,
    });
    return NextResponse.json({ service });
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

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, serviceId } = await params;
    const { supabase } = await requirePartnerOwner(id);
    await deletePartnerService({ supabase, partnerId: id, serviceId });
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
