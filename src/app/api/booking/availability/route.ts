import { NextResponse } from "next/server";

import {
  buildStartsAtIso,
  getAvailableBookableSlots,
  hourlySlotsBetween,
  isWorkingToday,
  todayDateInputValue,
} from "@/features/booking/lib/schedule-utils";
import {
  getBookableSlotsFromAttributes,
  parseStaffAttributes,
} from "@/features/staff/utils/attributes";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

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

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const date = searchParams.get("date") ?? todayDateInputValue();
    const durationMinutes = Number(searchParams.get("durationMinutes"));

    if (!staffId) {
      return NextResponse.json({ error: "staffId is required." }, { status: 400 });
    }

    if (!durationMinutes || Number.isNaN(durationMinutes)) {
      return NextResponse.json(
        { error: "durationMinutes is required." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();

    const { data: staffRow, error: staffError } = await supabase
      .from("staff")
      .select(
        "id, name, status, attributes, working_days, working_hours_start, working_hours_end",
      )
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (staffError || !staffRow) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const workingDays = staffRow.working_days ?? [];
    const workingHoursStart = (staffRow.working_hours_start ?? "09:00").slice(0, 5);
    const workingHoursEnd = (staffRow.working_hours_end ?? "18:00").slice(0, 5);
    const attributes = parseStaffAttributes(staffRow.attributes as never);
    const configuredSlots = getBookableSlotsFromAttributes(attributes);
    const bookableSlots =
      configuredSlots.length > 0
        ? configuredSlots
        : hourlySlotsBetween(workingHoursStart, workingHoursEnd);

    if (staffRow.status !== "active") {
      return NextResponse.json({
        slots: [],
        date,
        staffId,
        reason: "Staff is not available.",
        workingDays,
        bookableSlots,
      });
    }

    const localDate = new Date(`${date}T12:00:00`);
    if (!isWorkingToday(workingDays, localDate)) {
      return NextResponse.json({
        slots: [],
        date,
        staffId,
        reason: "Staff does not work on this day.",
        workingDays,
        bookableSlots,
      });
    }

    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const dayStart = zonedMidnightToUtcIso(date, timeZone);
    const [y, m, d] = date.split("-").map(Number);
    const nextDay = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const nextDate = nextDay.toISOString().slice(0, 10);
    const dayEndExclusive = zonedMidnightToUtcIso(nextDate, timeZone);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, starts_at, ends_at, duration_minutes, status")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .neq("status", "cancelled")
      .gte("starts_at", dayStart)
      .lt("starts_at", dayEndExclusive);

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 503 });
    }

    const adminBookings = (bookings ?? []).map((row) => ({
      id: row.id,
      staffId,
      staffName: staffRow.name,
      roomId: null,
      roomName: null,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      durationMinutes: row.duration_minutes,
      priceCents: 0,
      status: row.status as "confirmed",
      customerName: null,
      customerPhone: null,
      customerPostcode: null,
      customerEmail: null,
      notes: null,
      createdAt: row.starts_at,
      updatedAt: row.starts_at,
    }));

    const slots = getAvailableBookableSlots(
      date,
      bookableSlots,
      adminBookings,
      durationMinutes,
    );

    return NextResponse.json({
      date,
      staffId,
      slots,
      slotIsos: slots.map((slot) => buildStartsAtIso(date, slot)),
      workingDays,
      bookableSlots,
      reason:
        slots.length === 0
          ? "No open slots left for this day. Try another date."
          : null,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
