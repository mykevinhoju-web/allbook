import { NextResponse } from "next/server";

import { assignAvailableRoom } from "@/features/booking/lib/assign-room";
import { hasStaffBookingConflict } from "@/features/booking/lib/staff-conflict";
import { isStartTimeOnFiveMinuteSlot } from "@/features/booking/lib/schedule-utils";
import { getServicePriceCents } from "@/features/services/server/get-service-price";
import { sendBookingPushNotifications } from "@/lib/push/send-booking-push";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import type { BookingStatus } from "@/types";

function getTimeZoneOffsetMs(timeZone: string, utcDate: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(utcDate);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const second = Number(get("second"));

  const asUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  return asUtcMs - utcDate.getTime();
}

function zonedMidnightToUtcIso(date: string, timeZone: string): string {
  const [yearStr, monthStr, dayStr] = date.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetMs = getTimeZoneOffsetMs(timeZone, utcGuess);
  return new Date(utcGuess.getTime() - offsetMs).toISOString();
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

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const staffId = searchParams.get("staffId");

    if (!date) {
      return NextResponse.json({ error: "date is required." }, { status: 400 });
    }

    // Filter bookings by tenant-local day, not UTC midnight.
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const dayStart = zonedMidnightToUtcIso(date, timeZone);
    const [y, m, d] = date.split("-").map(Number);
    const nextDay = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const nextDate = nextDay.toISOString().slice(0, 10);
    const dayEndExclusive = zonedMidnightToUtcIso(nextDate, timeZone);

    const supabase = createServiceSupabase();
    let query = supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, customer_name, customer_phone, customer_postcode, customer_email, notes, created_at, updated_at, staff(name), rooms(name)",
      )
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .gte("starts_at", dayStart)
      .lt("starts_at", dayEndExclusive)
      .order("starts_at", { ascending: true });

    if (staffId) {
      query = query.eq("staff_id", staffId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      bookings: (data ?? []).map((row) => mapBooking(row)),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as {
      staffId?: string;
      startsAt?: string;
      durationMinutes?: number;
      customerName?: string;
      customerPhone?: string;
      customerPostcode?: string;
      customerEmail?: string;
      notes?: string;
      status?: BookingStatus;
      roomId?: string | null;
    };

    if (!body.staffId || !body.startsAt || !body.durationMinutes) {
      return NextResponse.json(
        { error: "staffId, startsAt, and durationMinutes are required." },
        { status: 400 },
      );
    }

    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Customer name and phone are required." },
        { status: 400 },
      );
    }

    const durationMinutes = body.durationMinutes;
    const supabase = createServiceSupabase();

    const priceCents = await getServicePriceCents(
      supabase,
      tenant.id,
      durationMinutes,
    );

    if (priceCents === null) {
      return NextResponse.json(
        { error: "No price configured for this service duration." },
        { status: 400 },
      );
    }

    const startsAt = new Date(body.startsAt);

    if (!isStartTimeOnFiveMinuteSlot(startsAt.toISOString())) {
      return NextResponse.json(
        { error: "Start time must be on a 5-minute step (e.g. 10:00, 10:05)." },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: "This staff member already has a booking in that time slot." },
        { status: 409 },
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
      return NextResponse.json(
        { error: "No treatment room available for this time slot." },
        { status: 409 },
      );
    }

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
        status: body.status ?? "confirmed",
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
      return NextResponse.json(
        { error: error?.message ?? "Failed to create booking." },
        { status: 503 },
      );
    }

    const created = mapBooking(data);

    // Notify staff/admin clients (realtime + push best-effort)
    void supabase.from("booking_alert_events").insert({
      tenant_slug: tenant.slug,
      staff_id: created.staffId,
      staff_name: created.staffName,
    });
    void sendBookingPushNotifications(tenant.slug, created.staffName);

    return NextResponse.json({ booking: created });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
