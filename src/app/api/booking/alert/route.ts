import { NextResponse } from "next/server";

import { notifyBookingAlert } from "@/features/booking/server/notify-booking-alert";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);

    let body: {
      tenantSlug?: string;
      staffId?: string;
      staffName?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { staffId, staffName } = body;

    if (body.tenantSlug && body.tenantSlug !== tenant.slug) {
      return NextResponse.json({ error: "Invalid tenant." }, { status: 400 });
    }

    if (!staffId || !staffName?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data: staffRow } = await supabase
      .from("staff")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (!staffRow) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const result = await notifyBookingAlert({
      tenantSlug: tenant.slug,
      staffId: staffRow.id,
      staffName: staffRow.name,
    });

    return NextResponse.json({
      ok: true,
      method: result.method,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
