import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

function mapStaffName(
  staff: { name: string } | { name: string }[] | null | undefined,
): string {
  if (Array.isArray(staff)) return staff[0]?.name ?? "Staff";
  return staff?.name ?? "Staff";
}

function mapRoomName(
  rooms: { name: string } | { name: string }[] | null | undefined,
): string | null {
  if (Array.isArray(rooms)) return rooms[0]?.name ?? null;
  return rooms?.name ?? null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id } = await params;
    const supabase = createServiceSupabase();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, payment_status, paid_at, customer_name, staff(name), rooms(name)",
      )
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const row = booking as {
      id: string;
      staff_id: string;
      room_id: string | null;
      starts_at: string;
      ends_at: string;
      duration_minutes: number;
      price_cents: number;
      status: string;
      payment_status: string;
      paid_at: string | null;
      customer_name: string | null;
      staff?: { name: string } | { name: string }[] | null;
      rooms?: { name: string } | { name: string }[] | null;
    };

    const { data: payment } = await supabase
      .from("payments")
      .select("status, paid_at")
      .eq("tenant_id", tenant.id)
      .eq("booking_id", id)
      .maybeSingle();

    const paid =
      row.payment_status === "paid" ||
      row.status === "confirmed" ||
      payment?.status === "succeeded";

    return NextResponse.json({
      booking: {
        id: row.id,
        staffName: mapStaffName(row.staff),
        roomName: mapRoomName(row.rooms),
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        durationMinutes: row.duration_minutes,
        priceCents: row.price_cents,
        status: row.status,
        paymentStatus: row.payment_status,
        customerName: row.customer_name,
      },
      paymentStatus: payment?.status ?? row.payment_status,
      paid,
      paidAt: payment?.paid_at ?? row.paid_at,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
