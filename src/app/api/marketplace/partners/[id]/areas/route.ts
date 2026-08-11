import { NextResponse } from "next/server";

import {
  createPartnerArea,
  listPartnerAreas,
  PartnerAuthError,
  requirePartnerOwner,
} from "@/features/marketplace-partner";
import type { PartnerAreaInput } from "@/features/marketplace-partner";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await requirePartnerOwner(id);
    const areas = await listPartnerAreas({ supabase, partnerId: id });
    return NextResponse.json({ areas });
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

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await requirePartnerOwner(id);
    const body = (await request.json()) as PartnerAreaInput;
    const area = await createPartnerArea({
      supabase,
      partnerId: id,
      input: body,
    });
    return NextResponse.json({ area }, { status: 201 });
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
