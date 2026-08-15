import { NextResponse } from "next/server";

import {
  isRoomStartBooking,
  parseRoomStartPayment,
} from "@/features/booking/lib/room-start";
import type { RoomStartRequest } from "@/features/booking/types/room-start-request";
import { createServiceSupabase } from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

function mapRequest(row: {
  id: string;
  staff_id: string;
  room_id: string | null;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  price_cents: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_postcode: string | null;
  customer_email: string | null;
  notes: string | null;
  created_at: string;
  staff?: { name: string } | { name: string }[] | null;
  rooms?: { name: string } | { name: string }[] | null;
}): RoomStartRequest {
  const staff = Array.isArray(row.staff) ? row.staff[0] : row.staff;
  const room = Array.isArray(row.rooms) ? row.rooms[0] : row.rooms;
  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: staff?.name ?? "Staff",
    roomId: row.room_id,
    roomName: room?.name ?? null,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerPostcode: row.customer_postcode,
    customerEmail: row.customer_email,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    requestedPayment: parseRoomStartPayment(row.notes),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
  };
}

/** Pending room Book-start bookings waiting for admin approval. */
export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const supabase = createServiceSupabase();

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, customer_name, customer_phone, customer_postcode, customer_email, notes, created_at, staff(name), rooms(name)",
      )
      .eq("tenant_id", tenant.id)
      .eq("status", "confirmed")
      .eq("payment_status", "unpaid")
      .is("checked_in_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const requests = (data ?? [])
      .filter((row) => isRoomStartBooking(row.notes))
      .map(mapRequest);

    return NextResponse.json({ requests });
  } catch (error) {
    const handled = handleAdminRouteError(error);
    if (handled) return handled;
    throw error;
  }
}
