import { NextResponse } from "next/server";

import {
  countBookingStaff,
  ensurePrimaryBookingStaff,
  listBookingStaff,
  MAX_BOOKING_STAFF,
} from "@/features/booking/lib/booking-staffs";
import { isBookingCheckedIn } from "@/features/booking/lib/booking-check-in";
import { hasStaffBookingConflict } from "@/features/booking/lib/staff-conflict";
import { findStaffAccountsByPin } from "@/lib/staff-pin-auth";
import { validateStaffPin } from "@/lib/staff-pin";
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

/**
 * Room tablet: join a second staff member onto an in-progress booking via PIN.
 * Primary staff must already be signed in on this tablet.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const roomSession = await requireRoomSession(tenant.id, request);
    const primarySession = await requireStaffSession(tenant.id, request);
    const { id } = await params;
    const body = (await request.json()) as { pin?: string };
    const pin = (body.pin ?? "").trim();
    const pinError = validateStaffPin(pin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data: booking, error: fetchError } = await supabase
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
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.room_id && booking.room_id !== roomSession.roomId) {
      return NextResponse.json(
        { error: "This booking is not in this room." },
        { status: 409 },
      );
    }

    if (booking.staff_id !== primarySession.staffId) {
      return NextResponse.json(
        { error: "Only the primary staff can add a second staff." },
        { status: 403 },
      );
    }

    if (
      !isBookingCheckedIn({
        checkedInAt: booking.checked_in_at,
        checkedOutAt: booking.checked_out_at,
        status: booking.status,
      })
    ) {
      return NextResponse.json(
        { error: "Check in first, then add a second staff." },
        { status: 400 },
      );
    }

    const currentCount = await countBookingStaff(supabase, tenant.id, id);
    if (currentCount === 0) {
      await ensurePrimaryBookingStaff(supabase, {
        tenantId: tenant.id,
        bookingId: id,
        staffId: booking.staff_id,
      });
    }
    const staffCount = Math.max(
      currentCount,
      await countBookingStaff(supabase, tenant.id, id),
    );
    if (staffCount >= MAX_BOOKING_STAFF) {
      return NextResponse.json(
        { error: "This booking already has two staff." },
        { status: 409 },
      );
    }

    const matches = await findStaffAccountsByPin(supabase, tenant.id, pin);
    if (matches.length === 0) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }
    if (matches.length > 1) {
      return NextResponse.json(
        {
          error:
            "This PIN matches more than one account. Ask your manager to assign a unique PIN.",
        },
        { status: 409 },
      );
    }

    const joinStaffId = matches[0]!.staff_id;
    if (joinStaffId === booking.staff_id) {
      return NextResponse.json(
        { error: "That staff is already the primary on this booking." },
        { status: 400 },
      );
    }

    const alreadyAssigned = (await listBookingStaff(supabase, tenant.id, id)).some(
      (row) => row.id === joinStaffId,
    );
    if (alreadyAssigned) {
      return NextResponse.json(
        { error: "That staff is already on this booking." },
        { status: 409 },
      );
    }

    if (
      await hasStaffBookingConflict(
        supabase,
        tenant.id,
        joinStaffId,
        booking.starts_at,
        booking.ends_at,
        id,
      )
    ) {
      return NextResponse.json(
        { error: "That staff already has another booking in this time window." },
        { status: 409 },
      );
    }

    const { data: staffRow } = await supabase
      .from("staff")
      .select("id, name, status")
      .eq("tenant_id", tenant.id)
      .eq("id", joinStaffId)
      .maybeSingle();

    if (!staffRow || staffRow.status === "inactive") {
      return NextResponse.json(
        { error: "Staff account is not available." },
        { status: 400 },
      );
    }

    const { error: insertError } = await supabase.from("booking_staffs").insert({
      tenant_id: tenant.id,
      booking_id: id,
      staff_id: joinStaffId,
      is_primary: false,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 503 });
    }

    const staff = await listBookingStaff(supabase, tenant.id, id);

    return NextResponse.json({
      ok: true,
      staff: staff.map((row) => ({
        id: row.id,
        name: row.name,
        isPrimary: row.isPrimary,
      })),
      joined: { id: staffRow.id, name: staffRow.name },
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    await requireRoomSession(tenant.id, request);
    const { id } = await params;
    const supabase = createServiceSupabase();
    const staff = await listBookingStaff(supabase, tenant.id, id);
    return NextResponse.json({
      staff: staff.map((row) => ({
        id: row.id,
        name: row.name,
        isPrimary: row.isPrimary,
      })),
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
    throw error;
  }
}
