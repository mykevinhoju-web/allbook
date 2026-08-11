import { NextResponse } from "next/server";

import {
  adminUpdatePartnerStatus,
  getPartnerById,
  listPartnerServices,
} from "@/features/marketplace-partner";
import type { PartnerStatus } from "@/features/marketplace-partner";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const supabase = createServiceSupabase();
    const partner = await getPartnerById(id, supabase);
    if (!partner) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const services = await listPartnerServices({ supabase, partnerId: id });
    return NextResponse.json({ partner, services });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const body = (await request.json()) as { status?: PartnerStatus };
    if (!body.status) {
      return NextResponse.json({ error: "status is required." }, { status: 400 });
    }
    const supabase = createServiceSupabase();
    const partner = await adminUpdatePartnerStatus({
      supabase,
      partnerId: id,
      status: body.status,
    });
    return NextResponse.json({ partner });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed." },
      { status: 400 },
    );
  }
}
