import type { StaffStatus } from "../types";

import type { ShiftPlan } from "./shift-plan";

export function parseDaySchedule(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, boolean> = {};
  for (const [date, working] of Object.entries(value)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && typeof working === "boolean") {
      result[date] = working;
    }
  }
  return result;
}

export function isStaffWorkingOnDate(
  status: StaffStatus,
  daySchedule: Record<string, boolean> | undefined,
  date: string,
  shiftPlan?: ShiftPlan,
): boolean {
  if (status !== "active") return false;
  if (daySchedule?.[date] === false) return false;

  if (shiftPlan && Object.keys(shiftPlan).length > 0) {
    return Boolean(shiftPlan[date]);
  }

  return true;
}

export function applyWorkingToday(
  daySchedule: Record<string, boolean>,
  today: string,
  workingToday: boolean,
): Record<string, boolean> {
  const next = { ...daySchedule };
  if (workingToday) {
    delete next[today];
  } else {
    next[today] = false;
  }
  return next;
}
