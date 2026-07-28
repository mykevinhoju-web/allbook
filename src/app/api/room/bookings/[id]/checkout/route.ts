import { NextResponse } from "next/server";

import { isBookingOccupyingRoom } from "@/features/booking/lib/room-occupancy";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  sendRoomTabletServiceEndPush,
  sendRoomVacatedPushNotifications,
} from "@/lib/push/send-booking-push";
import {
  RoomAuthError,
  requireRoomSession,
} from "@/lib/server/require-room-session";
import { StaffAuthError, requireStaffSession } from "@/lib/server/require-staff-session";
import { getStaffSessionCookieName } from "@/lib/staff-session";
import { markStaffSessionOffline } from "@/features/staff/lib/staff-presence";

/**
 * End service on the room tablet: checkout booking and clear staff session.
 * Room claim stays so the tablet returns to the PIN screen.
 * Locking the tablet (staff logout) must NOT call this route.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const roomSession = await requireRoomSession(tenant.id, request);
    const staffSession = await requireStaffSession(tenant.id, request);
    const { id } = await params;
    const supabase = createServiceSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, status, checked_out_at, checked_in_at",
      )
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 503 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (existing.staff_id !== staffSession.staffId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (existing.room_id && existing.room_id !== roomSession.roomId) {
      return NextResponse.json(
        { error: "This booking is not in this room." },
        { status: 409 },
      );
    }
    if (existing.checked_out_at || existing.status === "completed") {
      return NextResponse.json(
        { error: "This booking is already checked out." },
        { status: 400 },
      );
    }
    if (existing.status === "cancelled") {
      return NextResponse.json(
        { error: "Cancelled bookings cannot be checked out." },
        { status: 400 },
      );
    }

    const now = new Date();
    const inProgress =
      Boolean(existing.checked_in_at) ||
      isBookingOccupyingRoom(
        {
          startsAt: existing.starts_at,
          endsAt: existing.ends_at,
          checkedOutAt: existing.checked_out_at,
          status: existing.status,
        },
        now,
      );

    if (!inProgress) {
      return NextResponse.json(
        { error: "This booking is not in progress." },
        { status: 400 },
      );
    }

    const checkedOutAt = now.toISOString();
    const { data, error } = await supabase
      .from("bookings")
      .update({
        checked_out_at: checkedOutAt,
        ends_at: checkedOutAt,
        status: "completed",
        room_id: roomSession.roomId,
        updated_at: checkedOutAt,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select("id, staff_id, room_id")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not check out." },
        { status: 503 },
      );
    }

    const [{ data: staffRow }, { data: roomRow }] = await Promise.all([
      supabase
        .from("staff")
        .select("name")
        .eq("tenant_id", tenant.id)
        .eq("id", existing.staff_id)
        .maybeSingle(),
      supabase
        .from("rooms")
        .select("name")
        .eq("tenant_id", tenant.id)
        .eq("id", roomSession.roomId)
        .maybeSingle(),
    ]);

    void sendRoomVacatedPushNotifications(tenant.slug, {
      staffName: staffRow?.name ?? "Staff",
      roomName: roomRow?.name ?? roomSession.roomName,
    });
    void sendRoomTabletServiceEndPush(tenant.slug, {
      roomId: roomSession.roomId,
      roomName: roomRow?.name ?? roomSession.roomName,
      staffName: staffRow?.name ?? "Staff",
    });

    await markStaffSessionOffline(supabase, {
      tenantId: tenant.id,
      staffId: staffSession.staffId,
    });

    const response = NextResponse.json({
      ok: true,
      roomVacated: true,
      booking: {
        id: data.id,
        staffId: data.staff_id,
        roomId: data.room_id,
      },
    });
    response.cookies.delete(getStaffSessionCookieName());
    return response;
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RoomAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof StaffAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
