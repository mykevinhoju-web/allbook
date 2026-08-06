import { NextResponse } from "next/server";

import { createServiceSupabase } from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

export async function GET(request: Request) {
  try {
    const { tenant, actor } = await requireTenantAndAdminActor(request, {
      allowStaff: true,
    });
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    if (!since || Number.isNaN(Date.parse(since))) {
      return NextResponse.json(
        { error: "Query `since` must be a valid ISO timestamp." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    let query = supabase
      .from("booking_alert_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_slug", tenant.slug)
      .gt("created_at", since);

    if (actor.role === "staff") {
      query = query.eq("staff_id", actor.staffId);
    }

    const { count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    const handled = handleAdminRouteError(error);
    if (handled) return handled;
    throw error;
  }
}
