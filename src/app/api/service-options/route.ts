import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

const getServiceOptionsForTenant = unstable_cache(
  async (tenantId: string, currency: string) => {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("service_options")
      .select("duration_minutes, price_cents")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return {
      options: (data ?? []).map((row) => ({
        durationMinutes: row.duration_minutes,
        priceCents: row.price_cents,
      })),
      currency,
    };
  },
  ["public-service-options"],
  { revalidate: 60, tags: ["service-options"] },
);

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const payload = await getServiceOptionsForTenant(
      tenant.id,
      tenant.settings.currency,
    );

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    throw error;
  }
}
