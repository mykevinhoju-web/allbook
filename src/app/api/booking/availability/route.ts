import { NextResponse } from "next/server";

import {
  DEFAULT_BOOKING_TIMEZONE,
  DEFAULT_WORKING_HOURS_END,
  DEFAULT_WORKING_HOURS_START,
  datetimeLocalToIso,
  formatAmPmTime,
  formatShiftDateTime,
  getAvailableStartSlots,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import type { AdminBooking } from "@/features/booking/types/admin-booking";
import {
  parseStaffAttributes,
} from "@/features/staff/utils/attributes";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const durationMinutes = Number(searchParams.get("durationMinutes"));
    const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
    const date =
      searchParams.get("date") || todayDateInZone(timeZone);

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
      .select("id, name, status, attributes, working_hours_start, working_hours_end")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (staffError || !staffRow) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const attributes = parseStaffAttributes(staffRow.attributes as never);
    const daySchedule = parseDaySchedule(attributes.daySchedule);

    if (!isStaffWorkingOnDate(staffRow.status as "active", daySchedule, date)) {
      return NextResponse.json({
        slots: [],
        booked: [],
        date,
        timeZone,
        reason: "Staff is not working on this day.",
      });
    }

    const workStart =
      staffRow.working_hours_start?.slice(0, 5) || DEFAULT_WORKING_HOURS_START;
    const workEnd =
      staffRow.working_hours_end?.slice(0, 5) || DEFAULT_WORKING_HOURS_END;
    const dayStartIso = datetimeLocalToIso(`${date}T${workStart}`, timeZone);
    const dayEndIso = datetimeLocalToIso(`${date}T${workEnd}`, timeZone);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, starts_at, ends_at, customer_name, status")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .neq("status", "cancelled")
      .lt("starts_at", dayEndIso)
      .gt("ends_at", dayStartIso)
      .order("starts_at", { ascending: true });

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 503 });
    }

    const bookingRows = (bookings ?? []).map(
      (row) =>
        ({
          id: row.id,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
          customerName: row.customer_name,
          status: row.status,
        }) as AdminBooking,
    );

    const timeSlots = getAvailableStartSlots(
      date,
      workStart,
      workEnd,
      bookingRows,
      durationMinutes,
    );

    const slots = timeSlots.map((slot) => {
      const startsAt = datetimeLocalToIso(`${date}T${slot}`, timeZone);
      return {
        startsAt,
        label: formatAmPmTime(startsAt),
      };
    });

    const booked = bookingRows.map((row) => ({
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      customerName: row.customerName,
      label: `${formatShiftDateTime(row.startsAt, timeZone)} – ${formatShiftDateTime(row.endsAt, timeZone)}`,
    }));

    return NextResponse.json({
      slots,
      booked,
      date,
      timeZone,
      shiftLabel: `${formatShiftDateTime(dayStartIso, timeZone)} → ${formatShiftDateTime(dayEndIso, timeZone)}`,
      reason:
        slots.length === 0
          ? "No open times left today."
          : null,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
