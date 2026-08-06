import {
  addDaysToDateInput,
  datetimeLocalToIso,
  formatAmPmTime,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import type { StaffStatus } from "../types";
import {
  getShiftWindowFromAttributes,
  parseStaffAttributes,
  type StaffAttributes,
} from "./attributes";
import { isStaffWorkingOnDate, parseDaySchedule } from "./day-schedule";
import {
  parseShiftPlan,
  resolveShiftForCalendarDate,
  type ShiftPlan,
} from "./shift-plan";

export type StaffShiftWindow = {
  label: string;
  shiftStartsAt: string;
  shiftEndsAt: string;
  isOvernight: boolean;
};

/** Human-readable shift hours for a calendar date, e.g. "9:00 AM – 9:00 PM". */
export function getStaffShiftWindowForDate(args: {
  attributes: StaffAttributes | unknown;
  date: string;
  timeZone: string;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
}): StaffShiftWindow | null {
  const attrs =
    args.attributes && typeof args.attributes === "object"
      ? parseStaffAttributes(args.attributes as never)
      : {};
  const plan = parseShiftPlan(attrs.shiftPlan);
  const resolved = resolveShiftForCalendarDate(plan, args.date, args.timeZone);

  if (resolved) {
    return {
      label: `${formatAmPmTime(resolved.viewStartsAt)} – ${formatAmPmTime(resolved.viewEndsAt)}`,
      shiftStartsAt: resolved.viewStartsAt,
      shiftEndsAt: resolved.viewEndsAt,
      isOvernight: resolved.isOvernight,
    };
  }

  const legacy = getShiftWindowFromAttributes(attrs);
  if (legacy.shiftStartsAt && legacy.shiftEndsAt) {
    const dayStart = new Date(
      datetimeLocalToIso(`${args.date}T00:00`, args.timeZone),
    ).getTime();
    const dayEnd = new Date(
      datetimeLocalToIso(
        `${addDaysToDateInput(args.date, 1)}T00:00`,
        args.timeZone,
      ),
    ).getTime();
    const startMs = new Date(legacy.shiftStartsAt).getTime();
    const endMs = new Date(legacy.shiftEndsAt).getTime();
    // Ignore stale live-shift attributes that belong to another calendar day.
    if (startMs < dayEnd && endMs > dayStart) {
      return {
        label: `${formatAmPmTime(legacy.shiftStartsAt)} – ${formatAmPmTime(legacy.shiftEndsAt)}`,
        shiftStartsAt: legacy.shiftStartsAt,
        shiftEndsAt: legacy.shiftEndsAt,
        isOvernight: endMs - startMs > 12 * 60 * 60_000,
      };
    }
  }

  const start = args.workingHoursStart?.slice(0, 5);
  const end = args.workingHoursEnd?.slice(0, 5);
  if (start && end) {
    const shiftStartsAt = datetimeLocalToIso(
      `${args.date}T${start}`,
      args.timeZone,
    );
    const endDate =
      end <= start ? addDaysToDateInput(args.date, 1) : args.date;
    const shiftEndsAt = datetimeLocalToIso(
      `${endDate}T${end}`,
      args.timeZone,
    );
    return {
      label: `${formatAmPmTime(shiftStartsAt)} – ${formatAmPmTime(shiftEndsAt)}`,
      shiftStartsAt,
      shiftEndsAt,
      isOvernight: end <= start,
    };
  }

  return null;
}

export function getStaffShiftLabelForDate(
  attributes: StaffAttributes | unknown,
  date: string,
  timeZone: string,
  workingHoursStart?: string | null,
  workingHoursEnd?: string | null,
): string | null {
  return (
    getStaffShiftWindowForDate({
      attributes,
      date,
      timeZone,
      workingHoursStart,
      workingHoursEnd,
    })?.label ?? null
  );
}

/** True when staff can still accept a new booking on this calendar date. */
export function isStaffBookableOnDate(args: {
  status: StaffStatus;
  attributes: StaffAttributes | unknown;
  date: string;
  timeZone: string;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  now?: Date;
}): boolean {
  const attrs =
    args.attributes && typeof args.attributes === "object"
      ? parseStaffAttributes(args.attributes as never)
      : {};
  const shiftPlan = parseShiftPlan(attrs.shiftPlan);
  if (
    !isStaffWorkingOnDate(
      args.status,
      parseDaySchedule(attrs.daySchedule),
      args.date,
      shiftPlan,
      args.timeZone,
    )
  ) {
    return false;
  }

  const window = getStaffShiftWindowForDate({
    attributes: attrs,
    date: args.date,
    timeZone: args.timeZone,
    workingHoursStart: args.workingHoursStart,
    workingHoursEnd: args.workingHoursEnd,
  });

  // No explicit window (empty plan) — treat active staff as bookable; API uses live fallback.
  if (!window) {
    return args.status === "active" && Object.keys(shiftPlan).length === 0;
  }

  const now = args.now ?? new Date();
  const today = todayDateInZone(args.timeZone, now);
  if (
    args.date === today &&
    new Date(window.shiftEndsAt).getTime() <= now.getTime()
  ) {
    return false;
  }

  return (
    new Date(window.shiftEndsAt).getTime() >
    new Date(window.shiftStartsAt).getTime()
  );
}

export function getStaffWorkingTodayLabel(args: {
  status: StaffStatus;
  attributes: StaffAttributes | unknown;
  date: string;
  timeZone: string;
  daySchedule?: Record<string, boolean>;
  shiftPlan?: ShiftPlan;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
}): { workingToday: boolean; shiftLabel: string | null } {
  const attrs =
    args.attributes && typeof args.attributes === "object"
      ? parseStaffAttributes(args.attributes as never)
      : {};
  const daySchedule =
    args.daySchedule ?? parseDaySchedule(attrs.daySchedule);
  const shiftPlan = args.shiftPlan ?? parseShiftPlan(attrs.shiftPlan);
  const workingToday = isStaffWorkingOnDate(
    args.status,
    daySchedule,
    args.date,
    shiftPlan,
    args.timeZone,
  );

  return {
    workingToday,
    shiftLabel: workingToday
      ? getStaffShiftLabelForDate(
          attrs,
          args.date,
          args.timeZone,
          args.workingHoursStart,
          args.workingHoursEnd,
        )
      : null,
  };
}
