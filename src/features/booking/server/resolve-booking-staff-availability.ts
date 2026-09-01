import {
  addDaysToDateInput,
  getSlotsInShiftWindow,
  isoToDatetimeLocal,
  resolveShiftContainingTime,
  resolveStaffShiftForDate,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import { getShiftWindowFromAttributes, parseStaffAttributes } from "@/features/staff/utils/attributes";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import { isStaffOnShiftNow } from "@/features/staff/utils/shift-label";
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

  let firstSlot: { startsAt: string; anchorDate: string } | null = null;
  const bookableDates: string[] = [];

  for (let offset = 0; offset <= LOOKAHEAD_DAYS; offset += 1) {
    const date = addDaysToDateInput(today, offset);
    const slots = slotsForDate({
      ...base,
      date,
      useNow: offset === 0,
    });
    if (slots.length === 0) continue;
    bookableDates.push(date);
    if (!firstSlot) {
      const slot = slots[0]!;
      const shiftMatch = resolveShiftContainingTime(
        slot.startsAt,
        args.durationMinutes,
        timeZone,
        configured,
        args.workingHoursStart,
        args.workingHoursEnd,
        now,
        shiftPlan,
      );
      const slotLocalDate = isoToDatetimeLocal(slot.startsAt, timeZone).slice(0, 10);
      const shiftContext =
        resolveShiftForCalendarDate(shiftPlan, slotLocalDate, timeZone) ??
        resolveShiftForCalendarDate(shiftPlan, date, timeZone);
      const anchorDate =
        shiftMatch?.anchorDate ??
        shiftContext?.anchorDate ??
        slotLocalDate;
      firstSlot = { startsAt: slot.startsAt, anchorDate };
      break;
    }
  }

  if (!firstSlot) {
    return {
      tier: "none",
      tierRank: TIER_RANK.none,
      label: "Unavailable",
      detail: null,
      available: false,
    };
  }

  const tomorrow = addDaysToDateInput(today, 1);
  const anchorDate = firstSlot.anchorDate;
  const firstMs = new Date(firstSlot.startsAt).getTime();
  const deltaMs = firstMs - now.getTime();
  const slotDate = isoToDatetimeLocal(firstSlot.startsAt, timeZone).slice(0, 10);

  const onShiftNow = isStaffOnShiftNow({
    status: args.status,
    attributes: args.attributes,
    date: today,
    timeZone,
    workingHoursStart: args.workingHoursStart,
    workingHoursEnd: args.workingHoursEnd,
    now,
  });

  // Today's bucket: same shift anchor OR same calendar day as the first slot.
  // Overnight tails (e.g. 4am on the 4th belonging to the 3rd shift) use anchor;
  // a 3rd-afternoon slot must never show "tomorrow" just because anchor resolution failed.
  const isTodaysAvailability = anchorDate <= today || slotDate === today;

  if (isTodaysAvailability) {
    if (onShiftNow || deltaMs <= NOW_WINDOW_MS) {
      return {
        tier: "now",
        tierRank: TIER_RANK.now,
        label: "Available now",
        detail: null,
        available: true,
      };
    }

    return {
      tier: "soon",
      tierRank: TIER_RANK.soon,
      label: "Available soon",
      detail: null,
      available: true,
    };
  }

  if (anchorDate === tomorrow) {
    return {
      tier: "tomorrow",
      tierRank: TIER_RANK.tomorrow,
      label: "Available tomorrow",
      detail: null,
      available: true,
    };
  }

  const laterDates = bookableDates
    .filter((date) => date !== today)
    .slice(0, 4);

  if (laterDates.length === 0 && slotDate !== today) {
    laterDates.push(slotDate);
  }

  return {
    tier: "later",
    tierRank: TIER_RANK.later,
    label: "Bookings open",
    detail:
      laterDates.length > 0
        ? laterDates.map((date) => formatShortDate(date, timeZone)).join(" · ")
        : formatShortDate(slotDate, timeZone),
    available: true,
  };
}

export function compareBookingStaffAvailability(
  a: BookingStaffAvailability,
  b: BookingStaffAvailability,
): number {
  return a.tierRank - b.tierRank;
}
