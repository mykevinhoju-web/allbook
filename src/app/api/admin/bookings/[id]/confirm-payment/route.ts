import { NextResponse } from "next/server";

import {
  isOutCallBooking,
  visibleBookingNotes,
} from "@/features/booking/lib/booking-outcall";
import { isWalkInBooking } from "@/features/booking/lib/walk-in-rotation";
import {
  isOtherStaffBooking,
  parseOtherStaffName,
} from "@/features/booking/lib/booking-other-staff";
import {
  isSettledInternalPaymentMethod,
  parsePaymentMethodFromNotes,
  parseSplitCashCentsFromNotes,
  validateSplitCashCents,
  withPaymentMethodNote,
} from "@/features/booking/lib/internal-payment-method";
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

/** Confirm payment for a Pre booking (unpaid → settled). */
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
      paymentMethod?: string;
      splitCashCents?: number;
    };

    if (!isSettledInternalPaymentMethod(body.paymentMethod)) {
      return NextResponse.json(
        { error: "Select Cash, Card, or Split to confirm payment." },
        { status: 400 },
      );
    }
    const paymentMethod = body.paymentMethod;

    const supabase = createServiceSupabase();
    const { data: existing, error: existingError } = await supabase
      .from("bookings")
      .select("id, notes, price_cents, payment_status, status")
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
        { error: "Cancelled bookings cannot be confirmed." },
        { status: 400 },
      );
    }
    if (existing.payment_status !== "unpaid") {
      return NextResponse.json(
        { error: "This booking is already paid or does not need confirmation." },
        { status: 400 },
      );
    }

    let splitCashCents: number | null = null;
    if (paymentMethod === "split") {
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

    const { data, error } = await supabase
      .from("bookings")
      .update({
        payment_status: "not_required",
        notes: withPaymentMethodNote(
          paymentMethod,
          existing.notes,
          splitCashCents,
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(BOOKING_SELECT)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to confirm payment." },
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
