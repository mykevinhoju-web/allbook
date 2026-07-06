import type { StaffRecord } from "@/features/staff/types";
import { getShiftWindowFromAttributes } from "@/features/staff/utils/attributes";

import type { AdminBooking } from "../types/admin-booking";
import {
  resolveStaffShiftForDate,
  todayDateInZone,
} from "./schedule-utils";

export const SCHEDULE_GRID_STEP_MINUTES = 60;
export const SCHEDULE_GRID_ROW_HEIGHT_PX = 44;
/** Snap empty-slot taps to the nearest hour when creating a booking. */
export const SCHEDULE_GRID_SNAP_MINUTES = 60;

export interface ScheduleGridWindow {
  startMs: number;
  endMs: number;
}

export interface StaffShiftBand {
  staffId: string;
  startMs: number;
  endMs: number;
}

function roundDownToStep(ms: number, stepMinutes: number): number {
  const stepMs = stepMinutes * 60_000;
  return Math.floor(ms / stepMs) * stepMs;
}

function roundUpToStep(ms: number, stepMinutes: number): number {
  const stepMs = stepMinutes * 60_000;
  return Math.ceil(ms / stepMs) * stepMs;
}

export function getStaffShiftBand(
  member: StaffRecord,
  date: string,
  timeZone: string,
  now = new Date(),
): StaffShiftBand | null {
  const configured = getShiftWindowFromAttributes(member.attributes);
  const { shiftStartsAt, shiftEndsAt } =
    configured.shiftStartsAt && configured.shiftEndsAt
      ? {
          shiftStartsAt: configured.shiftStartsAt,
          shiftEndsAt: configured.shiftEndsAt,
        }
      : resolveStaffShiftForDate(
          date,
          timeZone,
          configured,
          member.workingHoursStart,
          member.workingHoursEnd,
          now,
        );

  const startMs = new Date(shiftStartsAt).getTime();
  const endMs = new Date(shiftEndsAt).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return null;
  }

  return { staffId: member.id, startMs, endMs };
}

/** Union of staff shift windows for the selected day, snapped to the grid step. */
export function computeScheduleGridWindow(
  staffMembers: StaffRecord[],
  date: string,
  timeZone: string,
  now = new Date(),
): ScheduleGridWindow | null {
  const bands = staffMembers
    .map((member) => getStaffShiftBand(member, date, timeZone, now))
    .filter((band): band is StaffShiftBand => band !== null);

  if (bands.length === 0) {
    const noon = new Date(`${date}T12:00:00`).getTime();
    const startMs = roundDownToStep(noon - 6 * 60 * 60_000, SCHEDULE_GRID_STEP_MINUTES);
    const endMs = roundUpToStep(noon + 6 * 60 * 60_000, SCHEDULE_GRID_STEP_MINUTES);
    return { startMs, endMs };
  }

  const rawStart = Math.min(...bands.map((band) => band.startMs));
  const rawEnd = Math.max(...bands.map((band) => band.endMs));

  return {
    startMs: roundDownToStep(rawStart, SCHEDULE_GRID_STEP_MINUTES),
    endMs: roundUpToStep(rawEnd, SCHEDULE_GRID_STEP_MINUTES),
  };
}

export function generateGridTimeLabels(
  window: ScheduleGridWindow,
  stepMinutes = SCHEDULE_GRID_STEP_MINUTES,
): number[] {
  const labels: number[] = [];
  const stepMs = stepMinutes * 60_000;

  for (let ms = window.startMs; ms < window.endMs; ms += stepMs) {
    labels.push(ms);
  }

  return labels;
}

export function gridDurationMs(window: ScheduleGridWindow): number {
  return Math.max(window.endMs - window.startMs, stepMs());
}

function stepMs(stepMinutes = SCHEDULE_GRID_STEP_MINUTES): number {
  return stepMinutes * 60_000;
}

export function msToGridTopPercent(
  ms: number,
  window: ScheduleGridWindow,
): number {
  const total = gridDurationMs(window);
  return ((ms - window.startMs) / total) * 100;
}

export function msToGridHeightPercent(
  startMs: number,
  endMs: number,
  window: ScheduleGridWindow,
): number {
  const total = gridDurationMs(window);
  return ((endMs - startMs) / total) * 100;
}

export function msToGridTopPx(
  ms: number,
  window: ScheduleGridWindow,
  totalHeightPx: number,
): number {
  return (msToGridTopPercent(ms, window) / 100) * totalHeightPx;
}

export function msToGridHeightPx(
  startMs: number,
  endMs: number,
  window: ScheduleGridWindow,
  totalHeightPx: number,
): number {
  return (msToGridHeightPercent(startMs, endMs, window) / 100) * totalHeightPx;
}

export function gridRowCount(window: ScheduleGridWindow): number {
  return Math.ceil(gridDurationMs(window) / stepMs());
}

export function gridTotalHeightPx(window: ScheduleGridWindow): number {
  return gridRowCount(window) * SCHEDULE_GRID_ROW_HEIGHT_PX;
}

export function formatGridTimeLabel(
  ms: number,
  timeZone: string,
  stepMinutes = SCHEDULE_GRID_STEP_MINUTES,
): string {
  return new Date(ms).toLocaleTimeString("en-AU", {
    timeZone,
    hour: "numeric",
    ...(stepMinutes < 60 ? { minute: "2-digit" as const } : {}),
    hour12: true,
  });
}

export function activeBookingsForStaff(
  bookings: AdminBooking[],
  staffId: string,
  window: ScheduleGridWindow,
): AdminBooking[] {
  return bookings
    .filter(
      (booking) =>
        booking.staffId === staffId &&
        booking.status !== "cancelled" &&
        booking.status !== "completed",
    )
    .filter((booking) => {
      const start = new Date(booking.startsAt).getTime();
      const end = new Date(booking.endsAt).getTime();
      return end > window.startMs && start < window.endMs;
    })
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}

export function snapMsToGridStep(
  ms: number,
  window: ScheduleGridWindow,
  stepMinutes = SCHEDULE_GRID_SNAP_MINUTES,
): number {
  const step = stepMs(stepMinutes);
  const snapped = roundDownToStep(ms, stepMinutes);
  return Math.max(window.startMs, Math.min(snapped, window.endMs - step));
}

export function isGridDateToday(
  date: string,
  timeZone: string,
  now = new Date(),
): boolean {
  return date === todayDateInZone(timeZone, now);
}

export function msToBarPercent(
  ms: number,
  startMs: number,
  endMs: number,
): number {
  if (endMs <= startMs) return 0;
  return Math.max(0, Math.min(100, ((ms - startMs) / (endMs - startMs)) * 100));
}
