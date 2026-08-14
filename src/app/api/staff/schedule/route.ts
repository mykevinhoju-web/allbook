import { NextResponse } from "next/server";

import {
  compareDateInputs,
  dateInTimeZone,
  inclusiveDaySpan,
  isValidReportDate,
  nextDateInput,
  reportDateRangeToUtc,
} from "@/features/admin/lib/revenue-report";
import {
  isOutCallBooking,
  visibleBookingNotes,
} from "@/features/booking/lib/booking-outcall";
import { isWalkInBooking } from "@/features/booking/lib/walk-in-rotation";
import {
  isOtherStaffBooking,
  parseOtherStaffName,
} from "@/features/booking/lib/booking-other-staff";
import { listBookingIdsForStaff } from "@/features/booking/lib/booking-staffs";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import type { AdminBooking, AdminRoom } from "@/features/booking/types/admin-booking";
import {
  parsePaymentMethodFromNotes,
  parseSplitCashCentsFromNotes,
} from "@/features/booking/lib/internal-payment-method";
import { touchStaffSessionPresence } from "@/features/staff/lib/staff-presence";
import type { StaffAttributes, StaffStatus } from "@/features/staff/types";
import {
  getStaffShiftWindowForDate,
  getStaffWorkingTodayLabel,
} from "@/features/staff/utils/shift-label";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { StaffAuthError, requireStaffSession } from "@/lib/server/require-staff-session";
import type { BookingStatus } from "@/types";

const MAX_SCHEDULE_RANGE_DAYS = 62;

const BOOKING_SELECT =
  "id, staff_id, room_id, starts_at, ends_at, duration_minutes, price_cents, status, checked_out_at, checked_in_at, customer_name, customer_phone, customer_postcode, customer_email, notes, payment_status, staff(name), rooms(name)";

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
  payment_status?: string | null;
  staff?: { name: string } | { name: string }[] | null;
  rooms?: { name: string } | { name: string }[] | null;
}): AdminBooking {
  const staffName = Array.isArray(row.staff)
    ? row.staff[0]?.name
    : row.staff?.name;
  const roomName = Array.isArray(row.rooms)
    ? row.rooms[0]?.name
    : row.rooms?.name;
  const otherStaffName = parseOtherStaffName(row.notes);

  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: otherStaffName ?? staffName ?? "Staff",
    roomId: row.room_id,
    roomName: roomName ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    status: row.status as BookingStatus,
    checkedOutAt: row.checked_out_at,
    checkedInAt: row.checked_in_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerPostcode: row.customer_postcode,
    customerEmail: row.customer_email,
    notes: visibleBookingNotes(row.notes),
    paymentMethod: parsePaymentMethodFromNotes(row.notes),
    splitCashCents: parseSplitCashCentsFromNotes(row.notes),
    paymentStatus: row.payment_status ?? null,
    outCall: isOutCallBooking(row.notes),
    walkIn: isWalkInBooking(row.notes),
    otherStaff: isOtherStaffBooking(row.notes),
    otherStaffName,
  };
}

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const session = await requireStaffSession(tenant.id, request);
    const { searchParams } = new URL(request.url);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const today = todayDateInZone(timeZone);

    let from = searchParams.get("from")?.trim() || "";
    let to = searchParams.get("to")?.trim() || "";
    const dateParam = searchParams.get("date")?.trim() || "";

    if (from || to) {
      if (!isValidReportDate(from) || !isValidReportDate(to)) {
        return NextResponse.json(
          { error: "from and to must be YYYY-MM-DD dates." },
          { status: 400 },
        );
      }
      if (compareDateInputs(from, to) > 0) {
        const swap = from;
        from = to;
        to = swap;
      }
      if (inclusiveDaySpan(from, to) > MAX_SCHEDULE_RANGE_DAYS) {
        return NextResponse.json(
          {
            error: `Date range cannot exceed ${MAX_SCHEDULE_RANGE_DAYS} days.`,
          },
          { status: 400 },
        );
      }
    } else {
      const date = dateParam || today;
      if (!isValidReportDate(date)) {
        return NextResponse.json(
          { error: "date must be YYYY-MM-DD." },
          { status: 400 },
        );
      }
      from = date;
      to = date;
    }

    const supabase = createServiceSupabase();

    void touchStaffSessionPresence(supabase, {
      tenantId: tenant.id,
      staffId: session.staffId,
    });

    const [{ data: staffRow }, { data: roomsRows }] = await Promise.all([
      supabase
        .from("staff")
        .select(
          "id, name, status, attributes, working_hours_start, working_hours_end",
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

    const { rangeStart, rangeEnd } = reportDateRangeToUtc(from, to, timeZone);
    const joinedIds = await listBookingIdsForStaff(
      supabase,
      tenant.id,
      session.staffId,
    );

    let bookingQuery = supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .lt("starts_at", rangeEnd)
      .gt("ends_at", rangeStart)
      .order("starts_at", { ascending: true });

    if (joinedIds.length > 0) {
      bookingQuery = bookingQuery.or(
        `staff_id.eq.${session.staffId},id.in.(${joinedIds.join(",")})`,
      );
    } else {
      bookingQuery = bookingQuery.eq("staff_id", session.staffId);
    }

    const { data: bookingRows, error } = await bookingQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const bookings = (bookingRows ?? []).map(mapBooking);
    const attributes = (staffRow.attributes ?? {}) as StaffAttributes;
    const status = (staffRow.status as StaffStatus) ?? "active";

    const countsByDate = new Map<string, number>();
    for (const booking of bookings) {
      const day = dateInTimeZone(booking.startsAt, timeZone);
      countsByDate.set(day, (countsByDate.get(day) ?? 0) + 1);
    }

    const days: {
      date: string;
      working: boolean;
      shiftLabel: string | null;
      bookingCount: number;
    }[] = [];
    for (
      let cursor = from;
      compareDateInputs(cursor, to) <= 0;
      cursor = nextDateInput(cursor)
    ) {
      const { workingToday, shiftLabel } = getStaffWorkingTodayLabel({
        status,
        attributes,
        date: cursor,
        timeZone,
        workingHoursStart: staffRow.working_hours_start,
        workingHoursEnd: staffRow.working_hours_end,
      });
      days.push({
        date: cursor,
        working: workingToday,
        shiftLabel,
        bookingCount: countsByDate.get(cursor) ?? 0,
      });
    }

    const focusDate = from === to ? from : null;
    const focusDay = focusDate
      ? days.find((day) => day.date === focusDate)
      : null;
    const shiftWindow =
      focusDay?.working
        ? getStaffShiftWindowForDate({
            attributes,
            date: focusDay.date,
            timeZone,
            workingHoursStart: staffRow.working_hours_start,
            workingHoursEnd: staffRow.working_hours_end,
          })
        : null;

    const rooms: AdminRoom[] = (roomsRows ?? []).map((room) => ({
      id: room.id,
      name: room.name,
      sortOrder: room.sort_order,
      isActive: room.is_active,
    }));

    return NextResponse.json({
      date: focusDate,
      from,
      to,
      staff: {
        id: staffRow.id,
        name: staffRow.name,
      },
      shift: shiftWindow
        ? {
            label: shiftWindow.label,
            shiftStartsAt: shiftWindow.shiftStartsAt,
            shiftEndsAt: shiftWindow.shiftEndsAt,
            isOvernight: shiftWindow.isOvernight,
          }
        : null,
      days,
      bookings,
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
