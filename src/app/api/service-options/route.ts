import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const supabase = createServiceSupabase();

    const { data, error } = await supabase
      .from("service_options")
      .select("duration_minutes, price_cents")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      options: (data ?? []).map((row) => ({
        durationMinutes: row.duration_minutes,
        priceCents: row.price_cents,
      })),
      currency: tenant.settings.currency,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
