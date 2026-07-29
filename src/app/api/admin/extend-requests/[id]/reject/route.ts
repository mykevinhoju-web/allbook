import { NextResponse } from "next/server";

import { createServiceSupabase } from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

/** Admin declines a room extend request. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(_request);
    const { id } = await params;
    const supabase = createServiceSupabase();

    const resolvedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("booking_extend_requests")
      .update({
        status: "rejected",
        resolved_at: resolvedAt,
        updated_at: resolvedAt,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .eq("status", "pending")
      .select("id, booking_id, minutes")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (!data) {
      return NextResponse.json(
        { error: "Request not found or already handled." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      requestId: data.id,
      bookingId: data.booking_id,
      minutes: data.minutes,
      resolvedAt,
    });
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
