import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-session";
import { isBookingOccupyingRoom } from "@/features/booking/lib/room-occupancy";
import { sendRoomVacatedPushNotifications } from "@/lib/push/send-booking-push";
import {
  getStaffSessionCookieName,
  verifyStaffSession,
} from "@/lib/staff-session";
import type { BookingStatus } from "@/types";

function mapBooking(row: {
  id: string;
  staff_id: string;
  room_id: string | null;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  price_cents: number;
  status: string;
  checked_out_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_postcode: string | null;
  customer_email: string | null;
  notes: string | null;
  staff?: { name: string } | { name: string }[] | null;
  rooms?: { name: string } | { name: string }[] | null;
}) {
  const staffName = Array.isArray(row.staff)
    ? row.staff[0]?.name
    : row.staff?.name;
  const roomName = Array.isArray(row.rooms)
    ? row.rooms[0]?.name
    : row.rooms?.name;

  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: staffName ?? "Staff",
    roomId: row.room_id,
    roomName: roomName ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    status: row.status as BookingStatus,
    checkedOutAt: row.checked_out_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerPostcode: row.customer_postcode,
    customerEmail: row.customer_email,
    notes: row.notes,
  };
}

const bookingSelect =
  "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, customer_name, customer_phone, customer_postcode, customer_email, notes, created_at, updated_at, staff(name), rooms(name)";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id } = await params;
    const cookieStore = await cookies();

    const adminToken = cookieStore.get(getAdminSessionCookieName())?.value;
    const staffToken = cookieStore.get(getStaffSessionCookieName())?.value;

    let isAdmin = false;
    let staffId: string | null = null;

    if (adminToken) {
      const admin = await verifyAdminSession(adminToken);
      if (admin?.tenantId === tenant.id) {
        isAdmin = true;
      }
    }

    if (!isAdmin && staffToken) {
      const staff = await verifyStaffSession(staffToken);
      if (staff?.tenantId === tenant.id) {
        staffId = staff.staffId;
      }
    }

    if (!isAdmin && !staffId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = createServiceSupabase();
    const { data: existing, error: fetchError } = await supabase
      .from("bookings")
      .select("id, staff_id, room_id, starts_at, ends_at, status, checked_out_at")
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 503 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (!isAdmin && existing.staff_id !== staffId) {
      return NextResponse.json(
        { error: "You can only check out your own booking." },
        { status: 403 },
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
    if (
      !isBookingOccupyingRoom(
        {
          startsAt: existing.starts_at,
          endsAt: existing.ends_at,
          checkedOutAt: existing.checked_out_at,
          status: existing.status,
        },
        now,
      )
    ) {
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
        updated_at: checkedOutAt,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(bookingSelect)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not check out." },
        { status: 503 },
      );
    }

    const booking = mapBooking(data);

    const [{ data: staffRow }, { data: roomRow }] = await Promise.all([
      supabase
        .from("staff")
        .select("name")
        .eq("tenant_id", tenant.id)
        .eq("id", existing.staff_id)
        .maybeSingle(),
      existing.room_id
        ? supabase
            .from("rooms")
            .select("name")
            .eq("tenant_id", tenant.id)
            .eq("id", existing.room_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    void sendRoomVacatedPushNotifications(tenant.slug, {
      staffName: staffRow?.name ?? booking.staffName,
      roomName: roomRow?.name ?? booking.roomName,
    });

    return NextResponse.json({ booking, roomVacated: true });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
