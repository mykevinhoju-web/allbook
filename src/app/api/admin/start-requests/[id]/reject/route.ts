import { NextResponse } from "next/server";

import { isRoomStartBooking } from "@/features/booking/lib/room-start";
import { createServiceSupabase } from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { id } = await params;
    const supabase = createServiceSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from("bookings")
      .select("id, notes, payment_status, status, checked_in_at")
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 503 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (
      existing.status === "cancelled" ||
      existing.checked_in_at ||
      existing.payment_status !== "unpaid" ||
      !isRoomStartBooking(existing.notes)
    ) {
      return NextResponse.json(
        { error: "This start request is no longer pending." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: now,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ ok: true, resolvedAt: now });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
