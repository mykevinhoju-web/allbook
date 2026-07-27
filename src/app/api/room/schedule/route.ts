import { NextResponse } from "next/server";

import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import { autoCheckoutExpiredBookings } from "@/features/booking/server/auto-checkout-expired";
import type { AdminBooking } from "@/features/booking/types/admin-booking";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  RoomAuthError,
  requireRoomSession,
} from "@/lib/server/require-room-session";
import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import {
  getStaffSessionCookieName,
  verifyStaffSession,
} from "@/lib/staff-session";
import { touchStaffSessionPresence } from "@/features/staff/lib/staff-presence";

function zonedMidnightToUtcIso(date: string, timeZone: string): string {
  const [yearStr, monthStr, dayStr] = date.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
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
  const parts = dtf.formatToParts(utcGuess);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const asUtcMs = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second")),
  );
  return new Date(utcGuess.getTime() - (asUtcMs - utcGuess.getTime())).toISOString();
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
  checked_out_at: string | null;
  checked_in_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_postcode: string | null;
  customer_email: string | null;
  notes: string | null;
  staff?: { name: string } | { name: string }[] | null;
  rooms?: { name: string } | { name: string }[] | null;
}): AdminBooking {
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

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const roomSession = await requireRoomSession(tenant.id, request);
    const { searchParams } = new URL(request.url);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const date = searchParams.get("date") ?? todayDateInZone(timeZone);

    const supabase = createServiceSupabase();
    await autoCheckoutExpiredBookings(supabase, { tenantId: tenant.id });

    const staffToken = readCookieFromRequest(
      request,
      getStaffSessionCookieName(),
    );
    if (staffToken) {
      const staffSession = await verifyStaffSession(staffToken);
      if (staffSession?.tenantId === tenant.id) {
        void touchStaffSessionPresence(supabase, {
          tenantId: tenant.id,
          staffId: staffSession.staffId,
        });
      }
    }

    const dayStart = zonedMidnightToUtcIso(date, timeZone);
    const nextDay = new Date(
      new Date(dayStart).getTime() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email, notes, staff(name), rooms(name)",
      )
      .eq("tenant_id", tenant.id)
      .eq("room_id", roomSession.roomId)
      .gte("starts_at", dayStart)
      .lt("starts_at", nextDay)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      date,
      room: { id: roomSession.roomId, name: roomSession.roomName },
      bookings: (data ?? []).map(mapBooking),
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
