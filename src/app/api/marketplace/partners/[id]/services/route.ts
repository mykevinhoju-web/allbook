import { NextResponse } from "next/server";

import {
  createPartnerService,
  listPartnerServices,
  PartnerAuthError,
  requirePartnerOwner,
} from "@/features/marketplace-partner";
import type { PartnerServiceInput } from "@/features/marketplace-partner";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await requirePartnerOwner(id);
    const services = await listPartnerServices({ supabase, partnerId: id });
    return NextResponse.json({ services });
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
    const body = (await request.json()) as PartnerServiceInput;
    const service = await createPartnerService({
      supabase,
      partnerId: id,
      input: body,
    });
    return NextResponse.json({ service }, { status: 201 });
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
