import { NextResponse } from "next/server";

import {
  canCheckInToBooking,
  computeCheckInServiceWindow,
  isBookingCheckedIn,
} from "@/features/booking/lib/booking-check-in";
import { isRoomOverlapConstraintError } from "@/features/booking/lib/validate-booking-update";
import {
  getCheckInBlockingStarts,
  findRoomActiveService,
  findStaffActiveService,
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { validateStaffPin } from "@/lib/staff-pin";
import { StaffAuthError, requireStaffSession } from "@/lib/server/require-staff-session";
import { verifyStaffPin } from "@/lib/server/verify-staff-pin";

const bookingSelect =
  "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email, notes, staff(name), rooms(name)";

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
  checked_in_at: string | null;
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
    status: row.status,
    checkedOutAt: row.checked_out_at,
    checkedInAt: row.checked_in_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerPostcode: row.customer_postcode,
    customerEmail: row.customer_email,
    notes: row.notes,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const session = await requireStaffSession(tenant.id, request);
    const { id } = await params;
    const body = (await request.json()) as { pin?: string; roomId?: string };

    const pinError = validateStaffPin(body.pin ?? "");
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    if (!body.roomId) {
      return NextResponse.json({ error: "roomId is required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    const pinOk = await verifyStaffPin(
      supabase,
      tenant.id,
      session.staffId,
      body.pin!,
    );
    if (!pinOk) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, status, checked_out_at, checked_in_at",
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

    if (existing.staff_id !== session.staffId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (
      isBookingCheckedIn({
        checkedInAt: existing.checked_in_at,
        checkedOutAt: existing.checked_out_at,
        status: existing.status,
      })
    ) {
      return NextResponse.json(
        { error: "Already checked in to this booking." },
        { status: 400 },
      );
    }

    if (
      !canCheckInToBooking({
        startsAt: existing.starts_at,
        endsAt: existing.ends_at,
        checkedInAt: existing.checked_in_at,
        checkedOutAt: existing.checked_out_at,
        status: existing.status,
      })
    ) {
      return NextResponse.json(
        { error: "Check-in is not available for this booking yet." },
        { status: 400 },
      );
    }

    const { data: room } = await supabase
      .from("rooms")
      .select("id, is_active")
      .eq("tenant_id", tenant.id)
      .eq("id", body.roomId)
      .maybeSingle();

    if (!room?.is_active) {
      return NextResponse.json({ error: "Room not available." }, { status: 400 });
    }

    const checkedInAtDate = new Date();
    const checkedInAt = checkedInAtDate.toISOString();
    const desiredEndsAt = new Date(
      checkedInAtDate.getTime() + existing.duration_minutes * 60_000,
    ).toISOString();

    const staffAlreadyInService = await findStaffActiveService(
      supabase,
      tenant.id,
      existing.staff_id,
      id,
    );
    if (staffAlreadyInService) {
      return NextResponse.json(
        {
          error:
            "You already have a service in progress. End that service before entering another booking.",
        },
        { status: 409 },
      );
    }

    const roomInService = await findRoomActiveService(
      supabase,
      tenant.id,
      body.roomId,
      id,
    );
    if (roomInService) {
      return NextResponse.json(
        {
          error:
            "That room is already in service. Pick another room or wait until it ends.",
        },
        { status: 409 },
      );
    }

    const blockingStarts = await getCheckInBlockingStarts(
      supabase,
      tenant.id,
      {
        roomId: body.roomId,
        staffId: existing.staff_id,
        fromIso: checkedInAt,
        untilIso: desiredEndsAt,
        excludeBookingId: id,
      },
    );

    const window = computeCheckInServiceWindow(
      checkedInAtDate,
      existing.duration_minutes,
      blockingStarts,
    );
    if (!window.ok) {
      return NextResponse.json({ error: window.error }, { status: 409 });
    }

    if (
      await hasStaffBookingConflict(
        supabase,
        tenant.id,
        existing.staff_id,
        window.startsAt,
        window.endsAt,
        id,
      )
    ) {
      return NextResponse.json(
        { error: "You already have another booking in this time window." },
        { status: 409 },
      );
    }

    const roomBusy = await hasRoomBookingConflict(
      supabase,
      tenant.id,
      body.roomId,
      window.startsAt,
      window.endsAt,
      id,
    );

    if (roomBusy) {
      return NextResponse.json(
        {
          error:
            "That room already has another booking for this time. Enter is not available.",
        },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({
        room_id: body.roomId,
        starts_at: window.startsAt,
        ends_at: window.endsAt,
        checked_in_at: checkedInAt,
        updated_at: checkedInAt,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(bookingSelect)
      .maybeSingle();

    if (error || !data) {
      if (isRoomOverlapConstraintError(error)) {
        return NextResponse.json(
          { error: "That room was just taken. Pick another room." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: error?.message ?? "Could not check in." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      booking: mapBooking(data),
      serviceWindowCapped: window.wasCapped,
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
