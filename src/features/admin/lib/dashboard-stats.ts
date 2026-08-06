import {
  dateInTimeZone,
  reportDateRangeToUtc,
  todayDateInZone,
} from "@/features/admin/lib/revenue-report";
import {
  datetimeLocalToIso,
  formatScheduleTime,
} from "@/features/booking/lib/schedule-utils";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import {
  getShiftWindowFromAttributes,
  parseStaffAttributes,
} from "@/features/staff/utils/attributes";
import {
  parseShiftPlan,
  resolveShiftForCalendarDate,
} from "@/features/staff/utils/shift-plan";
import type { StaffStatus } from "@/features/staff/types";

export type DashboardBookingRow = {
  id: string;
  staffId: string;
  staffName: string;
  startsAt: string;
  priceCents: number;
};

export type DashboardStaffRow = {
  id: string;
  name: string;
  status: StaffStatus;
  attributes: unknown;
};

export type DashboardStaffBookingCount = {
  staffId: string;
  staffName: string;
  bookingCount: number;
};

export type DashboardStats = {
  today: string;
  yesterday: string;
  todayBookingCount: number;
  yesterdayBookingCount: number;
  yesterdayRevenueCents: number;
  staffWorkingToday: { id: string; name: string; shiftLabel: string | null }[];
  bookingsByStaff: DashboardStaffBookingCount[];
};

export function yesterdayDateInZone(timeZone: string, now = new Date()): string {
  const today = todayDateInZone(timeZone, now);
  const [y, m, d] = today.split("-").map(Number);
  const prev = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  prev.setUTCDate(prev.getUTCDate() - 1);
  return prev.toISOString().slice(0, 10);
}

export function dashboardQueryRange(
  today: string,
  yesterday: string,
  timeZone: string,
): { rangeStart: string; rangeEnd: string } {
  return reportDateRangeToUtc(yesterday, today, timeZone);
}

export function buildDashboardStats(args: {
  today: string;
  yesterday: string;
  timeZone: string;
  bookings: DashboardBookingRow[];
  staff: DashboardStaffRow[];
}): DashboardStats {
  const { today, yesterday, timeZone, bookings, staff } = args;

  const todayBookings = bookings.filter(
    (booking) => dateInTimeZone(booking.startsAt, timeZone) === today,
  );
  const yesterdayBookings = bookings.filter(
    (booking) => dateInTimeZone(booking.startsAt, timeZone) === yesterday,
  );

  const yesterdayRevenueCents = yesterdayBookings.reduce(
    (sum, booking) => sum + Math.max(0, booking.priceCents || 0),
    0,
  );

  const staffWorkingToday = staff
    .filter((member) => {
      const attributes = parseStaffAttributes(member.attributes as never);
      return isStaffWorkingOnDate(
        member.status,
        parseDaySchedule(attributes.daySchedule),
        today,
        parseShiftPlan(attributes.shiftPlan),
        timeZone,
      );
    })
    .map((member) => {
      const attributes = parseStaffAttributes(member.attributes as never);
      const plan = parseShiftPlan(attributes.shiftPlan);
      const resolved = resolveShiftForCalendarDate(plan, today, timeZone);

      const fromIso = resolved?.shiftStartsAt ?? null;
      const toIso = resolved?.shiftEndsAt ?? null;

      const legacy = getShiftWindowFromAttributes(attributes);
      const fallbackFromIso =
        !fromIso && legacy.shiftStartsAt
          ? datetimeLocalToIso(legacy.shiftStartsAt, timeZone)
          : null;
      const fallbackToIso =
        !toIso && legacy.shiftEndsAt
          ? datetimeLocalToIso(legacy.shiftEndsAt, timeZone)
          : null;

      const startIso = fromIso ?? fallbackFromIso;
      const endIso = toIso ?? fallbackToIso;
      const shiftLabel =
        startIso && endIso
          ? `${formatScheduleTime(startIso)} – ${formatScheduleTime(endIso)}`
          : null;

      return { id: member.id, name: member.name, shiftLabel };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const byStaff = new Map<string, DashboardStaffBookingCount>();
  for (const booking of todayBookings) {
    const existing = byStaff.get(booking.staffId);
    if (existing) {
      existing.bookingCount += 1;
    } else {
      byStaff.set(booking.staffId, {
        staffId: booking.staffId,
        staffName: booking.staffName,
        bookingCount: 1,
      });
    }
  }

  const bookingsByStaff = [...byStaff.values()].sort(
    (a, b) =>
      b.bookingCount - a.bookingCount ||
      a.staffName.localeCompare(b.staffName),
  );

  return {
    today,
    yesterday,
    todayBookingCount: todayBookings.length,
    yesterdayBookingCount: yesterdayBookings.length,
    yesterdayRevenueCents,
    staffWorkingToday,
    bookingsByStaff,
  };
}
