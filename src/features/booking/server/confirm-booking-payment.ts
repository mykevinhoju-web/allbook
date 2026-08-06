import { scheduleBookingAlert } from "@/features/booking/server/notify-booking-alert";
import { createServiceSupabase } from "@/lib/admin/tenant-context";

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

/** Mark booking paid + confirmed and notify staff/admin. Idempotent. */
export async function confirmBookingPayment(args: {
  tenantId: string;
  tenantSlug: string;
  bookingId: string;
  stripePaymentIntentId: string;
  stripeChargeId?: string | null;
  paidAt?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = createServiceSupabase();
  const paidAt = args.paidAt ?? new Date().toISOString();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, status, booking_id")
    .eq("tenant_id", args.tenantId)
    .eq("booking_id", args.bookingId)
    .maybeSingle();

  if (!payment) {
    return { ok: false, reason: "Payment record not found." };
  }

  if (payment.status === "succeeded") {
    return { ok: true };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      "id, staff_id, room_id, starts_at, ends_at, status, staff(name), rooms(name)",
    )
    .eq("tenant_id", args.tenantId)
    .eq("id", args.bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    return { ok: false, reason: "Booking not found." };
  }

  const bookingRow = booking as {
    id: string;
    staff_id: string;
    room_id: string | null;
    starts_at: string;
    ends_at: string;
    status: string;
    staff?: { name: string } | { name: string }[] | null;
    rooms?: { name: string } | { name: string }[] | null;
  };

  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "succeeded",
      stripe_payment_intent_id: args.stripePaymentIntentId,
      stripe_charge_id: args.stripeChargeId ?? null,
      paid_at: paidAt,
      updated_at: paidAt,
    })
    .eq("id", payment.id)
    .eq("tenant_id", args.tenantId);

  if (paymentError) {
    return { ok: false, reason: paymentError.message };
  }

  const { error: bookingUpdateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      paid_at: paidAt,
      updated_at: paidAt,
    })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.bookingId);

  if (bookingUpdateError) {
    return { ok: false, reason: bookingUpdateError.message };
  }

  const staffName = mapStaffName(bookingRow.staff);
  const roomName = mapRoomName(bookingRow.rooms);

  scheduleBookingAlert({
    tenantSlug: args.tenantSlug,
    staffId: bookingRow.staff_id,
    staffName: staffName,
    roomName,
    startsAt: bookingRow.starts_at,
    endsAt: bookingRow.ends_at,
  });

  return { ok: true };
}

export async function failBookingPayment(args: {
  tenantId: string;
  bookingId: string;
  stripePaymentIntentId: string;
  failureMessage?: string;
}): Promise<void> {
  const supabase = createServiceSupabase();
  const now = new Date().toISOString();

  await supabase
    .from("payments")
    .update({
      status: "failed",
      stripe_payment_intent_id: args.stripePaymentIntentId,
      failure_message: args.failureMessage ?? null,
      updated_at: now,
    })
    .eq("tenant_id", args.tenantId)
    .eq("booking_id", args.bookingId);

  await supabase
    .from("bookings")
    .update({
      payment_status: "failed",
      updated_at: now,
    })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.bookingId)
    .eq("status", "pending");
}
