import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getAvailableExtendMinutes,
  getExtendBaseMs,
  getNextBlockingStartMs,
} from "@/features/booking/lib/booking-extend";
import {
  isInternalPaymentMethod,
  parseSplitCashCentsFromNotes,
  paymentMethodForPricing,
  parsePaymentMethodFromNotes,
  withPaymentMethodNote,
  type InternalPaymentMethod,
} from "@/features/booking/lib/internal-payment-method";
import {
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";
import { isRoomOverlapConstraintError } from "@/features/booking/lib/validate-booking-update";
import { computeBookingPriceCents } from "@/features/services/server/get-service-price";
import type { Database } from "@/types/database";

type ServiceClient = SupabaseClient<Database>;

export async function findExtendBlockingStarts(
  supabase: ServiceClient,
  tenantId: string,
  opts: {
    bookingId: string;
    roomId: string;
    staffId: string;
    fromIso: string;
  },
) {
  const untilIso = new Date(
    new Date(opts.fromIso).getTime() + 24 * 60 * 60_000,
  ).toISOString();

  const { data } = await supabase
    .from("bookings")
    .select("id, starts_at, room_id, staff_id")
    .eq("tenant_id", tenantId)
    .neq("id", opts.bookingId)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .gt("starts_at", opts.fromIso)
    .lt("starts_at", untilIso)
    .or(`room_id.eq.${opts.roomId},staff_id.eq.${opts.staffId}`);

  return (data ?? [])
    .filter(
      (row) =>
        row.room_id === opts.roomId || row.staff_id === opts.staffId,
    )
    .map((row) => row.starts_at);
}

export async function applyBookingExtend(options: {
  supabase: ServiceClient;
  tenantId: string;
  bookingId: string;
  minutes: number;
  timeZone: string;
  roomIdFallback?: string | null;
  allowedMinutes: number[];
  paymentMethod?: InternalPaymentMethod | null;
  pricingAdjustments?: Parameters<
    typeof computeBookingPriceCents
  >[1]["adjustments"];
}): Promise<
  | {
      ok: true;
      booking: {
        id: string;
        staffId: string;
        roomId: string | null;
        startsAt: string;
        endsAt: string;
        durationMinutes: number;
        priceCents: number;
        status: string;
        checkedOutAt: string | null;
        checkedInAt: string | null;
        customerName: string | null;
      };
      extendedByMinutes: number;
    }
  | { ok: false; status: number; error: string; availableExtendMinutes?: number[] }
> {
  const {
    supabase,
    tenantId,
    bookingId,
    minutes,
    timeZone,
    roomIdFallback,
    allowedMinutes,
    paymentMethod,
    pricingAdjustments,
  } = options;

  if (!allowedMinutes.includes(minutes)) {
    return {
      ok: false,
      status: 400,
      error: `minutes must be one of ${allowedMinutes.join(", ")}.`,
    };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select(
      "id, staff_id, room_id, starts_at, ends_at, duration_minutes, status, checked_out_at, checked_in_at, price_cents, staff_payout_cents, payment_status, notes",
    )
    .eq("tenant_id", tenantId)
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, status: 503, error: fetchError.message };
  }
  if (!existing) {
    return { ok: false, status: 404, error: "Booking not found." };
  }
  if (
    !existing.checked_in_at ||
    existing.checked_out_at ||
    existing.status === "completed" ||
    existing.status === "cancelled"
  ) {
    return {
      ok: false,
      status: 400,
      error: "This booking can no longer be extended.",
    };
  }

  const now = new Date();
  const baseMs = getExtendBaseMs(existing.ends_at, now);
  const newEndsAt = new Date(baseMs + minutes * 60_000);
  const startsMs = new Date(existing.starts_at).getTime();
  const durationMinutes = Math.max(
    1,
    Math.round((newEndsAt.getTime() - startsMs) / 60_000),
  );

  const roomId = existing.room_id ?? roomIdFallback ?? null;
  if (!roomId) {
    return { ok: false, status: 400, error: "Booking has no room assigned." };
  }

  const blockingStarts = await findExtendBlockingStarts(supabase, tenantId, {
    bookingId,
    roomId,
    staffId: existing.staff_id,
    fromIso: new Date(baseMs).toISOString(),
  });
  const nextBlockMs = getNextBlockingStartMs(baseMs, blockingStarts);
  const available = getAvailableExtendMinutes(
    existing.ends_at,
    blockingStarts,
    allowedMinutes,
    now,
  );

  if (nextBlockMs !== null && newEndsAt.getTime() > nextBlockMs) {
    const maxMinutes = Math.floor((nextBlockMs - baseMs) / 60_000);
    return {
      ok: false,
      status: 409,
      error:
        maxMinutes > 0
          ? `Cannot extend that long — next booking starts soon. Up to +${maxMinutes}m available.`
          : "Cannot extend — this room has another booking soon.",
      availableExtendMinutes: available,
    };
  }

  const [roomBusy, staffBusy] = await Promise.all([
    hasRoomBookingConflict(
      supabase,
      tenantId,
      roomId,
      existing.starts_at,
      newEndsAt.toISOString(),
      bookingId,
    ),
    hasStaffBookingConflict(
      supabase,
      tenantId,
      existing.staff_id,
      existing.starts_at,
      newEndsAt.toISOString(),
      bookingId,
    ),
  ]);
  if (roomBusy || staffBusy) {
    return {
      ok: false,
      status: 409,
      error: "Cannot extend — another booking conflicts.",
    };
  }

  const method =
    paymentMethod && isInternalPaymentMethod(paymentMethod)
      ? paymentMethod
      : parsePaymentMethodFromNotes(existing.notes);

  let priceCents = existing.price_cents;
  let staffPayoutCents = existing.staff_payout_cents;
  try {
    const isInternal = existing.payment_status === "not_required";
    const priced = await computeBookingPriceCents(supabase, {
      tenantId,
      durationMinutes,
      startsAtIso: existing.starts_at,
      timeZone,
      channel: isInternal ? "internal" : "external",
      adjustments: pricingAdjustments,
      paymentMethod: isInternal ? paymentMethodForPricing(method) : null,
    });
    if (priced && priced.totalCents > 0) {
      priceCents = priced.totalCents;
      staffPayoutCents = priced.staffPayoutCents ?? staffPayoutCents;
    }
  } catch {
    // keep previous
  }

  const notes =
    method && existing.payment_status === "not_required"
      ? withPaymentMethodNote(
          method,
          existing.notes,
          method === "split"
            ? parseSplitCashCentsFromNotes(existing.notes)
            : null,
        )
      : existing.notes;

  const { data, error } = await supabase
    .from("bookings")
    .update({
      ends_at: newEndsAt.toISOString(),
      duration_minutes: durationMinutes,
      price_cents: priceCents,
      staff_payout_cents: staffPayoutCents,
      room_id: roomId,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", bookingId)
    .select(
      "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name",
    )
    .maybeSingle();

  if (error || !data) {
    if (isRoomOverlapConstraintError(error)) {
      return { ok: false, status: 409, error: "Cannot extend — room conflict." };
    }
    return {
      ok: false,
      status: 503,
      error: error?.message ?? "Could not extend.",
    };
  }

  return {
    ok: true,
    booking: {
      id: data.id,
      staffId: data.staff_id,
      roomId: data.room_id,
      startsAt: data.starts_at,
      endsAt: data.ends_at,
      durationMinutes: data.duration_minutes,
      priceCents: data.price_cents,
      status: data.status,
      checkedOutAt: data.checked_out_at,
      checkedInAt: data.checked_in_at,
      customerName: data.customer_name,
    },
    extendedByMinutes: minutes,
  };
}
