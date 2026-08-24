import { NextResponse } from "next/server";

import { ensurePrimaryBookingStaff } from "@/features/booking/lib/booking-staffs";
import {
  isOtherStaffBooking,
  parseOtherStaffName,
  stripOtherStaffNote,
} from "@/features/booking/lib/booking-other-staff";
import {
  isOutCallBooking,
  visibleBookingNotes,
} from "@/features/booking/lib/booking-outcall";
import {
  isSettledInternalPaymentMethod,
  parsePaymentMethodFromNotes,
  parseSplitCashCentsFromNotes,
  validateSplitCashCents,
  withPaymentMethodNote,
} from "@/features/booking/lib/internal-payment-method";
import { hasStaffBookingConflict } from "@/features/booking/lib/staff-conflict";
import { isWalkInBooking } from "@/features/booking/lib/walk-in-rotation";
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

/** Assign a real staff member and convert a Pre booking into a regular booking. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request, {
      allowStaff: true,
    });
    const { id } = await params;
    const body = (await request.json()) as {
      staffId?: string;
      paymentMethod?: string;
      splitCashCents?: number;
    };
    const staffId = body.staffId?.trim() ?? "";

    if (!staffId) {
      return NextResponse.json(
        { error: "Select a staff member." },
        { status: 400 },
      );
    }
    if (!isSettledInternalPaymentMethod(body.paymentMethod)) {
      return NextResponse.json(
        { error: "Select Cash, Card, or Split to confirm the booking." },
        { status: 400 },
      );
    }
    const settledPayment = body.paymentMethod;

    const supabase = createServiceSupabase();
    const { data: existing, error: existingError } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, starts_at, ends_at, notes, payment_status, status, price_cents",
      )
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 503 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (existing.status === "cancelled") {
      return NextResponse.json(
        { error: "Cancelled bookings cannot be assigned." },
        { status: 400 },
      );
    }

    const paymentMethod = parsePaymentMethodFromNotes(existing.notes);
    if (paymentMethod !== "pre") {
      return NextResponse.json(
        { error: "Only a Pre booking can be confirmed as a booking." },
        { status: 400 },
      );
    }

    const { data: staffRow } = await supabase
      .from("staff")
      .select("id, name, status")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (!staffRow || staffRow.status !== "active") {
      return NextResponse.json(
        { error: "That staff member is not available." },
        { status: 400 },
      );
    }

    if (
      await hasStaffBookingConflict(
        supabase,
        tenant.id,
        staffId,
        existing.starts_at,
        existing.ends_at,
        id,
      )
    ) {
      return NextResponse.json(
        { error: "That staff member already has a booking in this time." },
        { status: 409 },
      );
    }

    let splitCashCents: number | null = null;
    if (settledPayment === "split") {
      splitCashCents = validateSplitCashCents(
        body.splitCashCents,
        existing.price_cents,
      );
      if (splitCashCents == null) {
        return NextResponse.json(
          {
            error:
              "Enter a cash amount greater than 0 and less than the total for Split.",
          },
          { status: 400 },
        );
      }
    }

    const notes = withPaymentMethodNote(
      settledPayment,
      stripOtherStaffNote(existing.notes),
      splitCashCents,
    );

    const { data, error } = await supabase
      .from("bookings")
      .update({
        staff_id: staffId,
        notes: notes || null,
        payment_status: "not_required",
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(BOOKING_SELECT)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not assign staff." },
        { status: 503 },
      );
    }

    await supabase.from("booking_staffs").delete().eq("booking_id", id);
    await ensurePrimaryBookingStaff(supabase, {
      tenantId: tenant.id,
      bookingId: id,
      staffId,
    });

    return NextResponse.json({ booking: mapBooking(data) });
  } catch (error) {
    const handled = handleAdminRouteError(error);
    if (handled) return handled;
    throw error;
  }
}
