import {
  DEFAULT_BOOKING_TIMEZONE,
  defaultShiftWindow,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";

import type { StaffFilterStatus, StaffPresence, StaffStatus } from "../types";

export const staffStatusOptions: { value: StaffStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
];

export const staffPresenceFilterOptions: {
  value: StaffFilterStatus;
  label: string;
}[] = [
  { value: "all", label: "All presence" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

/** @deprecated Prefer staffPresenceFilterOptions for the staff list. */
export const staffFilterOptions = staffPresenceFilterOptions;

export type { StaffPresence };

/** Common suggestions for the free-text nationality field (not a closed list). */
export const nationalityOptions = [
  "Australian",
  "Chinese",
  "Filipino",
  "Indian",
  "Japanese",
  "Korean",
  "Thai",
  "Vietnamese",
];

export const languageOptions = [
  "English",
  "Mandarin",
  "Cantonese",
  "Korean",
  "Japanese",
  "Vietnamese",
  "Thai",
  "Hindi",
  "Tagalog",
];

export function getDefaultStaffFormValues(
  timeZone = DEFAULT_BOOKING_TIMEZONE,
) {
  const shift = defaultShiftWindow(new Date(), timeZone);
  const today = todayDateInZone(timeZone);

  return {
    photos: [] as File[],
    name: "",
    age: "",
    height: "",
    weight: "",
    nationality: "",
    languages: [] as string[],
    experience: "",
    introduction: "",
    password: "",
    shiftStartsAt: shift.shiftStartsAt,
    shiftEndsAt: shift.shiftEndsAt,
    shiftPlan: {
      [today]: {
        startTime: shift.shiftStartsAt.slice(11, 16),
        endTime: shift.shiftEndsAt.slice(11, 16),
      },
    },
    workingToday: true,
    daySchedule: {} as Record<string, boolean>,
    status: "active" as StaffStatus,
  };
}

/** @deprecated Prefer getDefaultStaffFormValues(tenantTimezone) */
export const defaultStaffFormValues = getDefaultStaffFormValues();
