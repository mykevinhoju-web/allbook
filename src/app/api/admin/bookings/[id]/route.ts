import { NextResponse } from "next/server";

import { assignAvailableRoom } from "@/features/booking/lib/assign-room";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import type { Database } from "@/types/database";
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
  customer_postcode: string | null;
  customer_email: string | null;
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
    customerPostcode: row.customer_postcode,
    customerEmail: row.customer_email,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id } = await params;
    const body = (await request.json()) as {
      staffId?: string;
      startsAt?: string;
      durationMinutes?: number;
      status?: BookingStatus;
      customerName?: string;
      customerPhone?: string;
      customerPostcode?: string;
      customerEmail?: string;
      notes?: string;
      roomId?: string | null;
    };

    const supabase = createServiceSupabase();
    const { data: existing } = await supabase
      .from("bookings")
      .select("starts_at, duration_minutes")
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const updates: Database["public"]["Tables"]["bookings"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (body.staffId !== undefined) updates.staff_id = body.staffId;
    if (body.status !== undefined) updates.status = body.status;
    if (body.customerName !== undefined) updates.customer_name = body.customerName;
    if (body.customerPhone !== undefined) updates.customer_phone = body.customerPhone;
    if (body.customerPostcode !== undefined) {
      updates.customer_postcode = body.customerPostcode;
    }
    if (body.customerEmail !== undefined) updates.customer_email = body.customerEmail;
    if (body.notes !== undefined) updates.notes = body.notes;

    const startsAt = body.startsAt
      ? new Date(body.startsAt)
      : new Date(existing.starts_at);
    const durationMinutes =
      body.durationMinutes ?? existing.duration_minutes ?? 60;
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

    if (body.startsAt !== undefined || body.durationMinutes !== undefined) {
      updates.starts_at = startsAt.toISOString();
      updates.ends_at = endsAt.toISOString();
      updates.duration_minutes = durationMinutes;
    }

    if (body.roomId !== undefined || body.startsAt !== undefined || body.durationMinutes !== undefined) {
      updates.room_id =
        body.roomId ??
        (await assignAvailableRoom(
          supabase,
          tenant.id,
          startsAt.toISOString(),
          endsAt.toISOString(),
          id,
        ));
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, status, customer_name, customer_phone, customer_postcode, customer_email, notes, created_at, updated_at, staff(name), rooms(name)",
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ booking: mapBooking(data!) });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id } = await params;
    const supabase = createServiceSupabase();

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
