import { NextResponse } from "next/server";

import type { BookingExtendRequest } from "@/features/booking/types/extend-request";
import { createServiceSupabase } from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

function mapRequest(row: {
  id: string;
  booking_id: string;
  minutes: number;
  status: string;
  payment_method: string | null;
  price_cents: number | null;
  created_at: string;
  resolved_at: string | null;
  requested_by_staff_id: string;
  bookings?:
    | {
        customer_name: string | null;
        customer_phone: string | null;
        customer_postcode: string | null;
        customer_email: string | null;
        starts_at: string;
        ends_at: string;
        duration_minutes: number;
        room_id: string | null;
        rooms?: { name: string } | { name: string }[] | null;
      }
    | {
        customer_name: string | null;
        customer_phone: string | null;
        customer_postcode: string | null;
        customer_email: string | null;
        starts_at: string;
        ends_at: string;
        duration_minutes: number;
        room_id: string | null;
        rooms?: { name: string } | { name: string }[] | null;
      }[]
    | null;
  staff?: { name: string } | { name: string }[] | null;
}): BookingExtendRequest {
  const booking = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
  const staff = Array.isArray(row.staff) ? row.staff[0] : row.staff;
  const room = booking
    ? Array.isArray(booking.rooms)
      ? booking.rooms[0]
      : booking.rooms
    : null;

  return {
    id: row.id,
    bookingId: row.booking_id,
    minutes: row.minutes,
    status: row.status as BookingExtendRequest["status"],
    paymentMethod:
      row.payment_method === "cash" || row.payment_method === "card"
        ? row.payment_method
        : null,
    priceCents: row.price_cents,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    staffId: row.requested_by_staff_id,
    staffName: staff?.name ?? "Staff",
    roomId: booking?.room_id ?? null,
    roomName: room?.name ?? null,
    customerName: booking?.customer_name ?? null,
    customerPhone: booking?.customer_phone ?? null,
    customerPostcode: booking?.customer_postcode ?? null,
    customerEmail: booking?.customer_email ?? null,
    bookingStartsAt: booking?.starts_at ?? new Date().toISOString(),
    bookingEndsAt: booking?.ends_at ?? new Date().toISOString(),
    bookingDurationMinutes: booking?.duration_minutes ?? row.minutes,
  };
}

/** List pending room extend requests for admin approval. */
export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const supabase = createServiceSupabase();

    const { data, error } = await supabase
      .from("booking_extend_requests")
      .select(
        "id, booking_id, minutes, status, payment_method, price_cents, created_at, resolved_at, requested_by_staff_id, staff:requested_by_staff_id(name), bookings(customer_name, customer_phone, customer_postcode, customer_email, starts_at, ends_at, duration_minutes, room_id, rooms(name))",
      )
      .eq("tenant_id", tenant.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      requests: (data ?? []).map((row) => mapRequest(row)),
    });
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
