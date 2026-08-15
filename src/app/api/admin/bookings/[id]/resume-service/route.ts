import { NextResponse } from "next/server";

import { canResumeEndedService } from "@/features/booking/lib/booking-check-in";
import {
  isOutCallBooking,
  visibleBookingNotes,
} from "@/features/booking/lib/booking-outcall";
import {
  isOtherStaffBooking,
  parseOtherStaffName,
} from "@/features/booking/lib/booking-other-staff";
import {
  parsePaymentMethodFromNotes,
  parseSplitCashCentsFromNotes,
} from "@/features/booking/lib/internal-payment-method";
import { isWalkInBooking } from "@/features/booking/lib/walk-in-rotation";
import {
  findRoomActiveService,
  findStaffActiveService,
} from "@/features/booking/lib/staff-conflict";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import { createServiceSupabase } from "@/lib/admin/tenant-context";
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
  checked_in_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_postcode: string | null;
  customer_email: string | null;
  notes: string | null;
  payment_status: string | null;
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
  const otherStaffName = parseOtherStaffName(row.notes);
  const paymentMethod = parsePaymentMethodFromNotes(row.notes);

  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: otherStaffName ?? staffName ?? "Staff",
    roomId: row.room_id,
    roomName: roomName ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    status: row.status as BookingStatus,
    checkedOutAt: row.checked_out_at ?? null,
    checkedInAt: row.checked_in_at ?? null,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerPostcode: row.customer_postcode,
    customerEmail: row.customer_email,
    notes: visibleBookingNotes(row.notes),
    paymentMethod,
    splitCashCents: parseSplitCashCentsFromNotes(row.notes),
    paymentStatus: row.payment_status,
    outCall: isOutCallBooking(row.notes),
    walkIn: isWalkInBooking(row.notes),
    otherStaff: isOtherStaffBooking(row.notes),
    otherStaffName,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BOOKING_SELECT =
  "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email, notes, payment_status, created_at, updated_at, staff(name), rooms(name)";

/** Undo accidental checkout while the booked service window is still open. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant, actor } = await requireTenantAndAdminActor(request, {
      allowStaff: true,
    });
    const { id } = await params;
    const supabase = createServiceSupabase();

    const { data: existing, error: fetchError } = await supabase
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
    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (actor.role === "staff" && existing.staff_id !== actor.staffId) {
      return NextResponse.json(
        { error: "You can only resume your own booking." },
        { status: 403 },
      );
    }

    if (
      !canResumeEndedService({
        startsAt: existing.starts_at,
        endsAt: existing.ends_at,
        checkedOutAt: existing.checked_out_at,
        status: existing.status,
      })
    ) {
      return NextResponse.json(
        {
          error:
            "This booking can only be resumed during its scheduled service time.",
        },
        { status: 400 },
      );
    }

    const staffBusy = await findStaffActiveService(
      supabase,
      tenant.id,
      existing.staff_id,
      id,
    );
    if (staffBusy) {
      return NextResponse.json(
        { error: "This staff member already has a service in progress." },
        { status: 409 },
      );
    }

    if (existing.room_id) {
      const roomBusy = await findRoomActiveService(
        supabase,
        tenant.id,
        existing.room_id,
        id,
      );
      if (roomBusy) {
        return NextResponse.json(
          { error: "This room already has a service in progress." },
          { status: 409 },
        );
      }
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        checked_out_at: null,
        checked_in_at: existing.checked_in_at ?? nowIso,
        updated_at: nowIso,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(BOOKING_SELECT)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not resume service." },
        { status: 503 },
      );
    }

    return NextResponse.json({ booking: mapBooking(data) });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
