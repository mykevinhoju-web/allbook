import { NextResponse } from "next/server";

import {
  getAvailableExtendMinutes,
  getExtendBaseMs,
  getNextBlockingStartMs,
} from "@/features/booking/lib/booking-extend";
import {
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";
import { isRoomOverlapConstraintError } from "@/features/booking/lib/validate-booking-update";
import { computeBookingPriceCents } from "@/features/services/server/get-service-price";
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

const ALLOWED_EXTEND = new Set([5, 10, 15, 20, 30]);

async function findBlockingStarts(
  supabase: ReturnType<typeof createServiceSupabase>,
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

/** Room tablet: extend current service (requires room + staff session). */
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

    if (!ALLOWED_EXTEND.has(minutes)) {
      return NextResponse.json(
        { error: "minutes must be one of 5, 10, 15, 20, or 30." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const { data: existing, error: fetchError } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, status, checked_out_at, checked_in_at, price_cents, payment_status",
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

    const now = new Date();
    const baseMs = getExtendBaseMs(existing.ends_at, now);
    const newEndsAt = new Date(baseMs + minutes * 60_000);
    const startsMs = new Date(existing.starts_at).getTime();
    const durationMinutes = Math.max(
      1,
      Math.round((newEndsAt.getTime() - startsMs) / 60_000),
    );

    const roomId = existing.room_id ?? roomSession.roomId;
    const blockingStarts = await findBlockingStarts(supabase, tenant.id, {
      bookingId: id,
      roomId,
      staffId: existing.staff_id,
      fromIso: new Date(baseMs).toISOString(),
    });
    const nextBlockMs = getNextBlockingStartMs(baseMs, blockingStarts);
    const available = getAvailableExtendMinutes(
      existing.ends_at,
      blockingStarts,
      [...ALLOWED_EXTEND],
      now,
    );

    if (nextBlockMs !== null && newEndsAt.getTime() > nextBlockMs) {
      const maxMinutes = Math.floor((nextBlockMs - baseMs) / 60_000);
      return NextResponse.json(
        {
          error:
            maxMinutes > 0
              ? `Cannot extend that long — next booking starts soon. Up to +${maxMinutes}m available.`
              : "Cannot extend — this room has another booking soon.",
          maxExtendMinutes: Math.max(0, maxMinutes),
          availableExtendMinutes: available,
        },
        { status: 409 },
      );
    }

    const [roomBusy, staffBusy] = await Promise.all([
      hasRoomBookingConflict(
        supabase,
        tenant.id,
        roomId,
        existing.starts_at,
        newEndsAt.toISOString(),
        id,
      ),
      hasStaffBookingConflict(
        supabase,
        tenant.id,
        existing.staff_id,
        existing.starts_at,
        newEndsAt.toISOString(),
        id,
      ),
    ]);
    if (roomBusy || staffBusy) {
      return NextResponse.json(
        { error: "Cannot extend — another booking conflicts." },
        { status: 409 },
      );
    }

    let priceCents = existing.price_cents;
    try {
      const priced = await computeBookingPriceCents(supabase, {
        tenantId: tenant.id,
        durationMinutes,
        startsAtIso: existing.starts_at,
        timeZone: tenant.settings.timezone || "Australia/Sydney",
        channel:
          existing.payment_status === "not_required" ? "internal" : "external",
        adjustments: tenant.settings.pricingAdjustments,
      });
      if (priced && priced.totalCents > 0) priceCents = priced.totalCents;
    } catch {
      // keep previous
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({
        ends_at: newEndsAt.toISOString(),
        duration_minutes: durationMinutes,
        price_cents: priceCents,
        room_id: roomId,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name",
      )
      .maybeSingle();

    if (error || !data) {
      if (isRoomOverlapConstraintError(error)) {
        return NextResponse.json(
          { error: "Cannot extend — room conflict." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: error?.message ?? "Could not extend." },
        { status: 503 },
      );
    }

    return NextResponse.json({
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
