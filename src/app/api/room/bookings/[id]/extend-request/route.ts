import { NextResponse } from "next/server";

import {
  getAvailableExtendMinutes,
  getExtendBaseMs,
} from "@/features/booking/lib/booking-extend";
import { findExtendBlockingStarts } from "@/features/booking/server/apply-booking-extend";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  RoomAuthError,
  requireRoomSession,
} from "@/lib/server/require-room-session";
import { StaffAuthError, requireStaffSession } from "@/lib/server/require-staff-session";

/** Room tablet: request an admin-approved extend (does not extend yet). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const roomSession = await requireRoomSession(tenant.id, request);
    const staffSession = await requireStaffSession(tenant.id, request);
    const { id } = await params;
    const body = (await request.json()) as { minutes?: number };
    const minutes = Number(body.minutes);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return NextResponse.json(
        { error: "Select a service duration to extend." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const { data: options } = await supabase
      .from("service_options")
      .select("duration_minutes")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true);

    const allowed = (options ?? []).map((row) => row.duration_minutes);
    if (!allowed.includes(minutes)) {
      return NextResponse.json(
        { error: "Extend duration must match a service option." },
        { status: 400 },
      );
    }

    const { data: existingRaw, error: fetchError } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, status, checked_out_at, checked_in_at, customer_name, rooms(name), staff(name)",
      )
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 503 });
    }
    if (!existingRaw) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    type BookingRow = {
      id: string;
      staff_id: string;
      room_id: string | null;
      starts_at: string;
      ends_at: string;
      status: string;
      checked_out_at: string | null;
      checked_in_at: string | null;
      customer_name: string | null;
      staff?: { name: string } | { name: string }[] | null;
      rooms?: { name: string } | { name: string }[] | null;
    };
    const existing = existingRaw as BookingRow;

    if (existing.staff_id !== staffSession.staffId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (existing.room_id && existing.room_id !== roomSession.roomId) {
      return NextResponse.json(
        { error: "This booking is not in this room." },
        { status: 409 },
      );
    }
    if (
      !existing.checked_in_at ||
      existing.checked_out_at ||
      existing.status === "completed" ||
      existing.status === "cancelled"
    ) {
      return NextResponse.json(
        { error: "This booking can no longer be extended." },
        { status: 400 },
      );
    }

    const roomId = existing.room_id ?? roomSession.roomId;
    const now = new Date();
    const baseMs = getExtendBaseMs(existing.ends_at, now);
    const blockingStarts = await findExtendBlockingStarts(supabase, tenant.id, {
      bookingId: id,
      roomId,
      staffId: existing.staff_id,
      fromIso: new Date(baseMs).toISOString(),
    });
    const available = getAvailableExtendMinutes(
      existing.ends_at,
      blockingStarts,
      allowed,
      now,
    );
    if (!available.includes(minutes)) {
      return NextResponse.json(
        {
          error: "Cannot extend that long — next booking starts soon.",
          availableExtendMinutes: available,
        },
        { status: 409 },
      );
    }

    const { data: pendingExisting } = await supabase
      .from("booking_extend_requests")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("booking_id", id)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingExisting) {
      return NextResponse.json(
        {
          error: "An extend request is already waiting for admin approval.",
          requestId: pendingExisting.id,
        },
        { status: 409 },
      );
    }

    const { data: created, error: insertError } = await supabase
      .from("booking_extend_requests")
      .insert({
        tenant_id: tenant.id,
        booking_id: id,
        requested_by_staff_id: staffSession.staffId,
        minutes,
        status: "pending",
      })
      .select("id, minutes, created_at")
      .single();

    if (insertError || !created) {
      return NextResponse.json(
        { error: insertError?.message ?? "Could not create extend request." },
        { status: 503 },
      );
    }

    const staffName = Array.isArray(existing.staff)
      ? existing.staff[0]?.name
      : existing.staff?.name;
    const roomName = Array.isArray(existing.rooms)
      ? existing.rooms[0]?.name
      : existing.rooms?.name;

    return NextResponse.json({
      request: {
        id: created.id,
        bookingId: id,
        minutes: created.minutes,
        status: "pending",
        createdAt: created.created_at,
        staffName: staffName ?? "Staff",
        roomName: roomName ?? roomSession.roomName ?? "Room",
        customerName: existing.customer_name,
      },
    });
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

/** Room tablet: pending extend request for this booking (if any). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    await requireRoomSession(tenant.id, request);
    await requireStaffSession(tenant.id, request);
    const { id } = await params;
    const supabase = createServiceSupabase();

    const { data, error } = await supabase
      .from("booking_extend_requests")
      .select("id, minutes, status, created_at")
      .eq("tenant_id", tenant.id)
      .eq("booking_id", id)
      .eq("status", "pending")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      request: data
        ? {
            id: data.id,
            minutes: data.minutes,
            status: data.status,
            createdAt: data.created_at,
          }
        : null,
    });
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
