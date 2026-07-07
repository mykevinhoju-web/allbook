import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { StaffAuthError, requireStaffSession } from "@/lib/server/require-staff-session";
import { parseShiftPlan } from "@/features/staff/utils/shift-plan";
import { getShiftWindowFromAttributes } from "@/features/staff/utils/attributes";
import type { StaffAttributes } from "@/features/staff/types";
import {
  formatAmPmTime,
  resolveStaffShiftForDate,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import type { AdminBooking, AdminRoom } from "@/features/booking/types/admin-booking";

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
    const session = await requireStaffSession(tenant.id);
    const { searchParams } = new URL(request.url);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const date = searchParams.get("date") ?? todayDateInZone(timeZone);

    const supabase = createServiceSupabase();

    const [{ data: staffRow }, { data: roomsRows }] = await Promise.all([
      supabase
        .from("staff")
        .select(
          "id, name, attributes, working_hours_start, working_hours_end",
        )
        .eq("tenant_id", tenant.id)
        .eq("id", session.staffId)
        .maybeSingle(),
      supabase
        .from("rooms")
        .select("id, name, sort_order, is_active")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    if (!staffRow) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const rangeStart = zonedMidnightToUtcIso(date, timeZone);
    const [y, m, d] = date.split("-").map(Number);
    const nextDay = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12));
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const rangeEnd = zonedMidnightToUtcIso(
      nextDay.toISOString().slice(0, 10),
      timeZone,
    );

    const { data: bookingRows, error } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email, notes, staff(name), rooms(name)",
      )
      .eq("tenant_id", tenant.id)
      .eq("staff_id", session.staffId)
      .neq("status", "cancelled")
      .lt("starts_at", rangeEnd)
      .gt("ends_at", rangeStart)
      .order("starts_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const attributes = (staffRow.attributes ?? {}) as StaffAttributes;
    const configured = getShiftWindowFromAttributes(attributes);
    const shiftPlan = parseShiftPlan(attributes.shiftPlan);
    const shift = resolveStaffShiftForDate(
      date,
      timeZone,
      configured,
      staffRow.working_hours_start,
      staffRow.working_hours_end,
      undefined,
      shiftPlan,
    );

    const rooms: AdminRoom[] = (roomsRows ?? []).map((room) => ({
      id: room.id,
      name: room.name,
      sortOrder: room.sort_order,
      isActive: room.is_active,
    }));

    return NextResponse.json({
      date,
      staff: {
        id: staffRow.id,
        name: staffRow.name,
      },
      shift: shift
        ? {
            label: `${formatAmPmTime(shift.shiftStartsAt)} – ${formatAmPmTime(shift.shiftEndsAt)}`,
            shiftStartsAt: shift.shiftStartsAt,
            shiftEndsAt: shift.shiftEndsAt,
          }
        : null,
      bookings: (bookingRows ?? []).map((row) => mapBooking(row)),
      rooms,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof StaffAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
