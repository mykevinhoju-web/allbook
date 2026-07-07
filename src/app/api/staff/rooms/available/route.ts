import { NextResponse } from "next/server";

import { getRoomAvailabilityAtTime } from "@/features/booking/lib/room-availability";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { StaffAuthError, requireStaffSession } from "@/lib/server/require-staff-session";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const session = await requireStaffSession(tenant.id);
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, staff_id, room_id, starts_at, ends_at, duration_minutes, status")
      .eq("tenant_id", tenant.id)
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 503 });
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.staff_id !== session.staffId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const [{ data: rooms }, { data: overlaps }] = await Promise.all([
      supabase
        .from("rooms")
        .select("id, name, sort_order")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("bookings")
        .select("id, room_id, starts_at, ends_at, status")
        .eq("tenant_id", tenant.id)
        .neq("status", "cancelled")
        .neq("status", "completed")
        .not("room_id", "is", null)
        .lt("starts_at", booking.ends_at)
        .gt("ends_at", booking.starts_at),
    ]);

    const slotBookings = (overlaps ?? [])
      .filter((row) => row.id !== booking.id)
      .map((row) => ({
        roomId: row.room_id,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
      }));

    const availability = getRoomAvailabilityAtTime(
      (rooms ?? []).map((room) => ({ id: room.id, name: room.name })),
      booking.starts_at,
      booking.duration_minutes,
      slotBookings,
    );

    return NextResponse.json({
      assignedRoomId: booking.room_id,
      rooms: (rooms ?? []).map((room, index) => {
        const status = availability.find((item) => item.id === room.id);
        return {
          id: room.id,
          name: room.name,
          sortOrder: room.sort_order,
          priority: index + 1,
          available: status?.available ?? false,
          conflictLabel: status?.conflictLabel,
          isAssigned: room.id === booking.room_id,
        };
      }),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof StaffAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
