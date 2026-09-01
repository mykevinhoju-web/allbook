import {
  addDaysToDateInput,
  getSlotsInShiftWindow,
  resolveStaffShiftForDate,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import { getShiftWindowFromAttributes, parseStaffAttributes } from "@/features/staff/utils/attributes";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import { parseShiftPlan, resolveShiftForCalendarDate } from "@/features/staff/utils/shift-plan";
import type { ShiftPlan } from "@/features/staff/utils/shift-plan";
import type { StaffStatus } from "@/features/staff/types";

export type BookingStaffAvailabilityTier =
  | "now"
  | "soon"
  | "tomorrow"
  | "later"
  | "none";

export type BookingStaffAvailability = {
  tier: BookingStaffAvailabilityTier;
  tierRank: number;
  label: string;
  detail: string | null;
  available: boolean;
};

const TIER_RANK: Record<BookingStaffAvailabilityTier, number> = {
  now: 1,
  soon: 2,
  tomorrow: 3,
  later: 4,
  none: 5,
};

const NOW_WINDOW_MS = 60 * 60_000;
const LOOKAHEAD_DAYS = 14;

function formatShortDate(date: string, timeZone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
}

function slotsForDate(args: {
  date: string;
  timeZone: string;
  now: Date;
  durationMinutes: number;
  shiftPlan: ShiftPlan;
  daySchedule: ReturnType<typeof parseDaySchedule>;
  status: StaffStatus;
  configured: ReturnType<typeof getShiftWindowFromAttributes>;
  workingHoursStart: string;
  workingHoursEnd: string;
  bookings: { startsAt: string; endsAt: string }[];
  useNow: boolean;
}): { startsAt: string; label: string }[] {
  if (
    !isStaffWorkingOnDate(
      args.status,
      args.daySchedule,
      args.date,
      args.shiftPlan,
      args.timeZone,
    )
  ) {
    return [];
  }

  const { shiftStartsAt, shiftEndsAt } = resolveStaffShiftForDate(
    args.date,
    args.timeZone,
    args.configured,
    args.workingHoursStart,
    args.workingHoursEnd,
    args.now,
    args.shiftPlan,
  );

  const shiftStartMs = new Date(shiftStartsAt).getTime();
  const shiftEndMs = new Date(shiftEndsAt).getTime();
  if (!(shiftEndMs > shiftStartMs)) return [];

  const isToday = args.date === todayDateInZone(args.timeZone, args.now);
  if (isToday && shiftEndMs <= args.now.getTime()) return [];

  const shiftContext = resolveShiftForCalendarDate(
    args.shiftPlan,
    args.date,
    args.timeZone,
  );

  const relevantBookings = args.bookings.filter((row) => {
    const start = new Date(row.startsAt).getTime();
    const end = new Date(row.endsAt).getTime();
    return start < shiftEndMs && end > shiftStartMs;
  });

  return getSlotsInShiftWindow(
    shiftStartsAt,
    shiftEndsAt,
    args.durationMinutes,
    relevantBookings,
    {
      timeZone: args.timeZone,
      now: args.useNow && isToday ? args.now : undefined,
      anchorDate: shiftContext?.anchorDate,
    },
  );
}

export function resolveBookingStaffAvailability(args: {
  status: StaffStatus;
  attributes: unknown;
  workingHoursStart: string;
  workingHoursEnd: string;
  bookings: { startsAt: string; endsAt: string }[];
  durationMinutes: number;
  timeZone: string;
  now?: Date;
}): BookingStaffAvailability {
  const now = args.now ?? new Date();
  const timeZone = args.timeZone;
  const today = todayDateInZone(timeZone, now);
  const tomorrow = addDaysToDateInput(today, 1);
  const attrs = parseStaffAttributes(args.attributes as never);
  const configured = getShiftWindowFromAttributes(attrs);
  const shiftPlan = parseShiftPlan(attrs.shiftPlan);
  const daySchedule = parseDaySchedule(attrs.daySchedule);

  const base = {
    timeZone,
    now,
    durationMinutes: args.durationMinutes,
    shiftPlan,
    daySchedule,
    status: args.status,
    configured,
    workingHoursStart: args.workingHoursStart,
    workingHoursEnd: args.workingHoursEnd,
    bookings: args.bookings,
  };

  const todaySlots = slotsForDate({ ...base, date: today, useNow: true });
  if (todaySlots.length > 0) {
    const firstMs = new Date(todaySlots[0]!.startsAt).getTime();
    const isNow = firstMs - now.getTime() <= NOW_WINDOW_MS;
    return {
      tier: isNow ? "now" : "soon",
      tierRank: TIER_RANK[isNow ? "now" : "soon"],
      label: isNow ? "Available now" : "Available soon",
      detail: null,
      available: true,
    };
  }

  const tomorrowSlots = slotsForDate({
    ...base,
    date: tomorrow,
    useNow: false,
  });
  if (tomorrowSlots.length > 0) {
    return {
      tier: "tomorrow",
      tierRank: TIER_RANK.tomorrow,
      label: "Available tomorrow",
      detail: null,
      available: true,
    };
  }

  const laterDates: string[] = [];
  for (let offset = 2; offset <= LOOKAHEAD_DAYS; offset += 1) {
    const date = addDaysToDateInput(today, offset);
    const slots = slotsForDate({ ...base, date, useNow: false });
    if (slots.length > 0) laterDates.push(date);
    if (laterDates.length >= 4) break;
  }

  if (laterDates.length > 0) {
    return {
      tier: "later",
      tierRank: TIER_RANK.later,
      label: "Bookings open",
      detail: laterDates.map((date) => formatShortDate(date, timeZone)).join(" · "),
      available: true,
    };
  }

  return {
    tier: "none",
    tierRank: TIER_RANK.none,
    label: "Unavailable",
    detail: null,
    available: false,
  };
}

export function compareBookingStaffAvailability(
  a: BookingStaffAvailability,
  b: BookingStaffAvailability,
): number {
  return a.tierRank - b.tierRank;
}
