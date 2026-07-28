import { assignAvailableRoom } from "@/features/booking/lib/assign-room";
import {
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";
import { isStartTimeOnFiveMinuteSlot } from "@/features/booking/lib/schedule-utils";
import {
  assertStaffSlotIsBookable,
  BookingTimeValidationError,
} from "@/features/booking/lib/validate-booking-time";
import { scheduleBookingAlert } from "@/features/booking/server/notify-booking-alert";
import { ensurePrimaryBookingStaff } from "@/features/booking/lib/booking-staffs";
import { computeBookingPriceCents } from "@/features/services/server/get-service-price";
import type { BookingPriceChannel } from "@/features/services/lib/pricing-adjustments";
import { createServiceSupabase } from "@/lib/admin/tenant-context";
import type { Tenant } from "@/features/tenants/types";
import type { BookingStatus } from "@/types";

function isOverlapConstraintError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "23P01" ||
    error.message?.includes("bookings_staff_no_overlap") === true ||
    error.message?.includes("bookings_room_no_overlap") === true
  );
}


export interface CreatedBooking {
  id: string;
  staffId: string;
  staffName: string;
  roomId: string | null;
  roomName: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  priceCents: number;
  status: BookingStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerPostcode: string | null;
  customerEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapBooking(row: {
  id: string;
  staff_id: string;
  room_id: string | null;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  price_cents: number;
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
}): CreatedBooking {
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

export class CreateBookingError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "CreateBookingError";
  }
}

export async function createTenantBooking(
  tenant: Tenant,
  body: {
    staffId: string;
    startsAt: string;
    durationMinutes: number;
    customerName: string;
    customerPhone: string;
    customerPostcode?: string;
    customerEmail?: string;
    notes?: string;
    status?: BookingStatus;
    roomId?: string | null;
    /** When false, skip push/alert (e.g. pending checkout). Default true. */
    notify?: boolean;
    paymentStatus?: "unpaid" | "paid" | "failed" | "refunded" | "not_required";
    /** internal = admin/walk-in; external = customer checkout. Default external. */
    pricingChannel?: BookingPriceChannel;
  },
): Promise<CreatedBooking> {
  const durationMinutes = body.durationMinutes;
  const supabase = createServiceSupabase();
  const timeZone = tenant.settings.timezone || "Australia/Sydney";
  const channel = body.pricingChannel ?? "external";

  const priced = await computeBookingPriceCents(supabase, {
    tenantId: tenant.id,
    durationMinutes,
    startsAtIso: body.startsAt,
    timeZone,
    channel,
    adjustments: tenant.settings.pricingAdjustments,
  });

  if (priced === null) {
    throw new CreateBookingError(
      "No price configured for this service duration.",
      400,
    );
  }
  const priceCents = priced.totalCents;

  const startsAt = new Date(body.startsAt);

  if (!isStartTimeOnFiveMinuteSlot(startsAt.toISOString())) {
    throw new CreateBookingError(
      "Start time must be on a 5-minute step (e.g. 10:00, 10:05).",
      400,
    );
  }

  try {
    await assertStaffSlotIsBookable(
      supabase,
      tenant,
      body.staffId,
      startsAt.toISOString(),
      durationMinutes,
    );
  } catch (error) {
    if (error instanceof BookingTimeValidationError) {
      throw new CreateBookingError(error.message, error.status);
    }
    throw error;
  }

  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  if (
    await hasStaffBookingConflict(
      supabase,
      tenant.id,
      body.staffId,
      startsAt.toISOString(),
      endsAt.toISOString(),
    )
  ) {
    throw new CreateBookingError(
      "This staff member already has a booking in that time slot.",
      409,
    );
  }

  const roomId =
    body.roomId ??
    (await assignAvailableRoom(
      supabase,
      tenant.id,
      startsAt.toISOString(),
      endsAt.toISOString(),
    ));

  if (!roomId) {
    throw new CreateBookingError(
      "No treatment room available for this time slot.",
      409,
    );
  }

  if (
    await hasRoomBookingConflict(
      supabase,
      tenant.id,
      roomId,
      startsAt.toISOString(),
      endsAt.toISOString(),
    )
  ) {
    throw new CreateBookingError(
      "This room is already booked for that time slot.",
      409,
    );
  }

  const status = body.status ?? "confirmed";
  const paymentStatus =
    body.paymentStatus ??
    (status === "pending" ? "unpaid" : "not_required");
  const shouldNotify = body.notify ?? status !== "pending";

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      tenant_id: tenant.id,
      staff_id: body.staffId,
      room_id: roomId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      duration_minutes: durationMinutes,
      price_cents: priceCents,
      status,
      payment_status: paymentStatus,
      customer_name: body.customerName.trim(),
      customer_phone: body.customerPhone.trim(),
      customer_postcode: body.customerPostcode?.trim() ?? null,
      customer_email: body.customerEmail?.trim() ?? null,
      notes: body.notes ?? null,
    })
    .select(
      "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, customer_name, customer_phone, customer_postcode, customer_email, notes, created_at, updated_at, staff(name), rooms(name)",
    )
    .single();

  if (error || !data) {
    if (isOverlapConstraintError(error)) {
      throw new CreateBookingError(
        "This staff member already has a booking in that time slot.",
        409,
      );
    }

    throw new CreateBookingError(
      error?.message ?? "Failed to create booking.",
      503,
    );
  }

  try {
    await ensurePrimaryBookingStaff(supabase, {
      tenantId: tenant.id,
      bookingId: data.id,
      staffId: body.staffId,
    });
  } catch (staffError) {
    await supabase.from("bookings").delete().eq("id", data.id);
    throw new CreateBookingError(
      staffError instanceof Error
        ? staffError.message
        : "Failed to assign staff to booking.",
      503,
    );
  }

  const created = mapBooking(data);

  if (shouldNotify) {
    // Notifications must not block the booking response under load.
    scheduleBookingAlert({
      tenantSlug: tenant.slug,
      staffId: created.staffId,
      staffName: created.staffName,
      roomName: created.roomName,
      startsAt: created.startsAt,
      endsAt: created.endsAt,
    });
  }

  return created;
}
