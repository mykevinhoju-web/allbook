import { NextResponse } from "next/server";

import { isBookingCheckedIn } from "@/features/booking/lib/booking-check-in";
import { ensurePrimaryBookingStaff } from "@/features/booking/lib/booking-staffs";
import {
  isInternalPaymentMethod,
  withPaymentMethodNote,
} from "@/features/booking/lib/internal-payment-method";
import {
  findRoomActiveService,
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";
import { computeBookingPriceCents } from "@/features/services/server/get-service-price";
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
import {
  StaffAuthError,
  requireStaffSession,
} from "@/lib/server/require-staff-session";

const PAIR_PREFIX = "[pair:";

function pairNote(primaryBookingId: string): string {
  return `${PAIR_PREFIX}${primaryBookingId}]`;
}

function parsePairBookingId(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/\[pair:([0-9a-f-]{36})\]/i);
  return match?.[1] ?? null;
}

/**
 * Room tablet: create a second (companion) booking for another staff.
 * Same customer + room as the in-progress booking; starts now; cash/card like admin.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const roomSession = await requireRoomSession(tenant.id, request);
    const primarySession = await requireStaffSession(tenant.id, request);
    const { id: primaryBookingId } = await params;
    const body = (await request.json()) as {
      pin?: string;
      durationMinutes?: number;
      paymentMethod?: string;
    };

    const pin = (body.pin ?? "").trim();
    const pinError = validateStaffPin(pin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const durationMinutes = Number(body.durationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return NextResponse.json(
        { error: "Select a service duration." },
        { status: 400 },
      );
    }

    if (!isInternalPaymentMethod(body.paymentMethod)) {
      return NextResponse.json(
        { error: "Select cash or card payment." },
        { status: 400 },
      );
    }
    const paymentMethod = body.paymentMethod;

    const supabase = createServiceSupabase();
    const { data: primary, error: fetchError } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email",
      )
      .eq("tenant_id", tenant.id)
      .eq("id", primaryBookingId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 503 });
    }
    if (!primary) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const roomId = primary.room_id ?? roomSession.roomId;
    if (primary.room_id && primary.room_id !== roomSession.roomId) {
      return NextResponse.json(
        { error: "This booking is not in this room." },
        { status: 409 },
      );
    }

    if (primary.staff_id !== primarySession.staffId) {
      return NextResponse.json(
        { error: "Only the staff on this booking can add a second staff." },
        { status: 403 },
      );
    }

    if (
      !isBookingCheckedIn({
        checkedInAt: primary.checked_in_at,
        checkedOutAt: primary.checked_out_at,
        status: primary.status,
      })
    ) {
      return NextResponse.json(
        { error: "Check in first, then add a second staff." },
        { status: 400 },
      );
    }

    if (!primary.customer_name?.trim() || !primary.customer_phone?.trim()) {
      return NextResponse.json(
        { error: "Primary booking is missing customer details." },
        { status: 400 },
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
    if (joinStaffId === primary.staff_id) {
      return NextResponse.json(
        { error: "Choose a different staff PIN for the second booking." },
        { status: 400 },
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

    const now = new Date();
    const startsAtIso = now.toISOString();
    const endsAtIso = new Date(
      now.getTime() + durationMinutes * 60_000,
    ).toISOString();
    const timeZone = tenant.settings.timezone || "Australia/Sydney";

    if (
      await hasStaffBookingConflict(
        supabase,
        tenant.id,
        joinStaffId,
        startsAtIso,
        endsAtIso,
      )
    ) {
      return NextResponse.json(
        { error: "That staff already has another booking in this time window." },
        { status: 409 },
      );
    }

    const { data: pairRows } = await supabase
      .from("bookings")
      .select("id, notes")
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .like("notes", `%${PAIR_PREFIX}${primaryBookingId}]%`);

    const pairExcludeIds = [
      primaryBookingId,
      ...((pairRows ?? [])
        .filter((row) => parsePairBookingId(row.notes) === primaryBookingId)
        .map((row) => row.id)),
    ];

    // Same visit may share the room; block any unrelated in-progress service.
    const roomInService = await findRoomActiveService(
      supabase,
      tenant.id,
      roomId,
      pairExcludeIds,
    );
    if (roomInService) {
      return NextResponse.json(
        {
          error:
            "This room already has another service in progress. Finish that first.",
        },
        { status: 409 },
      );
    }

    if (
      await hasRoomBookingConflict(
        supabase,
        tenant.id,
        roomId,
        startsAtIso,
        endsAtIso,
        pairExcludeIds,
      )
    ) {
      return NextResponse.json(
        { error: "This room has another booking that overlaps that duration." },
        { status: 409 },
      );
    }

    const priced = await computeBookingPriceCents(supabase, {
      tenantId: tenant.id,
      durationMinutes,
      startsAtIso,
      timeZone,
      channel: "internal",
      adjustments: tenant.settings.pricingAdjustments,
      paymentMethod,
    });

    if (priced === null) {
      return NextResponse.json(
        { error: "No price configured for this service duration." },
        { status: 400 },
      );
    }

    const { data: created, error: insertError } = await supabase
      .from("bookings")
      .insert({
        tenant_id: tenant.id,
        staff_id: joinStaffId,
        room_id: roomId,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
        duration_minutes: durationMinutes,
        price_cents: priced.totalCents,
        status: "confirmed",
        payment_status: "not_required",
        checked_in_at: startsAtIso,
        customer_name: primary.customer_name.trim(),
        customer_phone: primary.customer_phone.trim(),
        customer_postcode: primary.customer_postcode,
        customer_email: primary.customer_email,
        notes: withPaymentMethodNote(paymentMethod, pairNote(primaryBookingId)),
      })
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email, notes",
      )
      .single();

    if (insertError || !created) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create second booking." },
        { status: 503 },
      );
    }

    try {
      await ensurePrimaryBookingStaff(supabase, {
        tenantId: tenant.id,
        bookingId: created.id,
        staffId: joinStaffId,
      });
    } catch {
      // Non-fatal for schedule join table.
    }

    return NextResponse.json({
      ok: true,
      booking: {
        id: created.id,
        staffId: created.staff_id,
        staffName: staffRow.name,
        roomId: created.room_id,
        startsAt: created.starts_at,
        endsAt: created.ends_at,
        durationMinutes: created.duration_minutes,
        priceCents: created.price_cents,
        status: created.status,
        checkedInAt: created.checked_in_at,
        checkedOutAt: created.checked_out_at,
        customerName: created.customer_name,
        customerPhone: created.customer_phone,
        customerPostcode: created.customer_postcode,
        customerEmail: created.customer_email,
        paymentMethod,
      },
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

/** List the shared visit: primary + companions (works for either booking id). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    await requireRoomSession(tenant.id, request);
    const { id } = await params;
    const supabase = createServiceSupabase();

    const bookingSelect =
      "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_in_at, checked_out_at, customer_name, notes, staff(name), rooms(name)";

    type VisitRow = {
      id: string;
      staff_id: string;
      room_id: string | null;
      starts_at: string;
      ends_at: string;
      duration_minutes: number;
      price_cents: number;
      status: string;
      checked_in_at: string | null;
      checked_out_at: string | null;
      customer_name: string | null;
      notes: string | null;
      staff?: { name: string } | { name: string }[] | null;
      rooms?: { name: string } | { name: string }[] | null;
    };

    const { data: seed, error: seedError } = await supabase
      .from("bookings")
      .select(bookingSelect)
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (seedError) {
      return NextResponse.json({ error: seedError.message }, { status: 503 });
    }
    if (!seed) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const seedRow = seed as VisitRow;
    const pairedPrimaryId = parsePairBookingId(seedRow.notes);
    const primaryId = pairedPrimaryId ?? id;

    let primaryRow = seedRow;
    if (primaryId !== id) {
      const { data, error: primaryError } = await supabase
        .from("bookings")
        .select(bookingSelect)
        .eq("tenant_id", tenant.id)
        .eq("id", primaryId)
        .maybeSingle();
      if (primaryError) {
        return NextResponse.json(
          { error: primaryError.message },
          { status: 503 },
        );
      }
      if (!data) {
        return NextResponse.json(
          { error: "Primary booking not found." },
          { status: 404 },
        );
      }
      primaryRow = data as VisitRow;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(bookingSelect)
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .like("notes", `%${PAIR_PREFIX}${primaryId}]%`)
      .order("starts_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const mapVisit = (row: VisitRow) => {
      const staffMember = Array.isArray(row.staff) ? row.staff[0] : row.staff;
      const room = Array.isArray(row.rooms) ? row.rooms[0] : row.rooms;
      return {
        id: row.id,
        staffId: row.staff_id,
        staffName: staffMember?.name ?? "Staff",
        roomId: row.room_id,
        roomName: room?.name ?? null,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        durationMinutes: row.duration_minutes,
        priceCents: row.price_cents,
        status: row.status,
        checkedInAt: row.checked_in_at,
        checkedOutAt: row.checked_out_at,
        customerName: row.customer_name,
      };
    };

    const primary = mapVisit(primaryRow);
    const companions = ((data ?? []) as VisitRow[])
      .filter((row) => parsePairBookingId(row.notes) === primaryId)
      .map(mapVisit);

    return NextResponse.json({
      primary,
      companions,
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
