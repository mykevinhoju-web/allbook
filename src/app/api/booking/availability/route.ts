import { NextResponse } from "next/server";

import {
  DEFAULT_BOOKING_TIMEZONE,
  formatShiftDateTime,
  getSlotsInShiftWindow,
  resolveStaffShiftForDate,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import {
  getShiftWindowFromAttributes,
  parseStaffAttributes,
} from "@/features/staff/utils/attributes";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import { parseShiftPlan, resolveShiftForCalendarDate } from "@/features/staff/utils/shift-plan";
import type { StaffStatus } from "@/features/staff/types";
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
    const now = new Date();
    const date =
      searchParams.get("date")?.trim() || todayDateInZone(timeZone, now);

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
        "id, name, status, attributes, working_hours_start, working_hours_end",
      )
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (staffError || !staffRow) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const attributes = parseStaffAttributes(staffRow.attributes as never);
    const configured = getShiftWindowFromAttributes(attributes);
    const shiftPlan = parseShiftPlan(attributes.shiftPlan);
    const { shiftStartsAt, shiftEndsAt } = resolveStaffShiftForDate(
      date,
      timeZone,
      configured,
      staffRow.working_hours_start,
      staffRow.working_hours_end,
      now,
      shiftPlan,
    );

    if (staffRow.status !== "active") {
      return NextResponse.json({
        slots: [],
        booked: [],
        shiftStartsAt,
        shiftEndsAt,
        date,
        reason: "Staff is not available.",
      });
    }

    const daySchedule = parseDaySchedule(attributes.daySchedule);
    const shiftContext = resolveShiftForCalendarDate(shiftPlan, date, timeZone);
    if (
      !isStaffWorkingOnDate(
        staffRow.status as StaffStatus,
        daySchedule,
        date,
        shiftPlan,
        timeZone,
      )
    ) {
      return NextResponse.json({
        slots: [],
        booked: [],
        shiftStartsAt,
        shiftEndsAt,
        date,
        reason: "Staff is not working on this day.",
      });
    }

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, starts_at, ends_at, customer_name, status")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .neq("status", "cancelled")
      .neq("status", "completed")
      .lt("starts_at", shiftEndsAt)
      .gt("ends_at", shiftStartsAt)
      .order("starts_at", { ascending: true });

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 503 });
    }

    const bookingRows = bookings ?? [];
    const slots = getSlotsInShiftWindow(
      shiftStartsAt,
      shiftEndsAt,
      durationMinutes,
      bookingRows.map((row) => ({
        startsAt: row.starts_at,
        endsAt: row.ends_at,
      })),
      {
        timeZone,
        now: date === todayDateInZone(timeZone, now) ? now : undefined,
        anchorDate: shiftContext?.anchorDate,
      },
    );

    const booked = bookingRows.map((row) => ({
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      customerName: row.customer_name,
      label: `${formatShiftDateTime(row.starts_at, timeZone)} – ${formatShiftDateTime(row.ends_at, timeZone)}`,
    }));

    const shiftLabel = shiftContext
      ? shiftContext.isTailOnly
        ? `Night shift from ${formatShiftDateTime(shiftContext.shiftStartsAt, timeZone)} → ${formatShiftDateTime(shiftContext.shiftEndsAt, timeZone)}`
        : `${formatShiftDateTime(shiftContext.shiftStartsAt, timeZone)} → ${formatShiftDateTime(shiftContext.shiftEndsAt, timeZone)}`
      : `${formatShiftDateTime(shiftStartsAt, timeZone)} → ${formatShiftDateTime(shiftEndsAt, timeZone)}`;

    return NextResponse.json({
      slots,
      booked,
      shiftStartsAt,
      shiftEndsAt,
      date,
      timeZone,
      shiftLabel,
      reason:
        slots.length === 0
          ? "No open times left in this availability window."
          : null,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
