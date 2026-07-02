import { NextResponse } from "next/server";

import { assignAvailableRoom } from "@/features/booking/lib/assign-room";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import type { BookingStatus } from "@/types";

function mapBooking(row: {
  id: string;
  staff_id: string;
  room_id: string | null;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
    status: row.status as BookingStatus,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const staffId = searchParams.get("staffId");

    if (!date) {
      return NextResponse.json({ error: "date is required." }, { status: 400 });
    }

    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;

    const supabase = createServiceSupabase();
    let query = supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, status, customer_name, customer_phone, notes, created_at, updated_at, staff(name), rooms(name)",
      )
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd)
      .order("starts_at", { ascending: true });

    if (staffId) {
      query = query.eq("staff_id", staffId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      bookings: (data ?? []).map((row) => mapBooking(row)),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as {
      staffId?: string;
      startsAt?: string;
      durationMinutes?: number;
      customerName?: string;
      customerPhone?: string;
      notes?: string;
      status?: BookingStatus;
      roomId?: string | null;
    };

    if (!body.staffId || !body.startsAt || !body.durationMinutes) {
      return NextResponse.json(
        { error: "staffId, startsAt, and durationMinutes are required." },
        { status: 400 },
      );
    }

    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(startsAt.getTime() + body.durationMinutes * 60_000);

    const supabase = createServiceSupabase();

    const roomId =
      body.roomId ??
      (await assignAvailableRoom(
        supabase,
        tenant.id,
        startsAt.toISOString(),
        endsAt.toISOString(),
      ));

    if (!roomId) {
      return NextResponse.json(
        { error: "No treatment room available for this time slot." },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        tenant_id: tenant.id,
        staff_id: body.staffId,
        room_id: roomId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        duration_minutes: body.durationMinutes,
        status: body.status ?? "confirmed",
        customer_name: body.customerName ?? null,
        customer_phone: body.customerPhone ?? null,
        notes: body.notes ?? null,
      })
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, status, customer_name, customer_phone, notes, created_at, updated_at, staff(name), rooms(name)",
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create booking." },
        { status: 503 },
      );
    }

    return NextResponse.json({ booking: mapBooking(data) });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
