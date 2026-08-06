import type {
  StaffBreakType,
  StaffDayOfWeek,
  StaffLeaveType,
  StaffRole,
  StaffWorkingDay,
} from "./types";

export const STAFF_ROLES: StaffRole[] = [
  "Owner",
  "Senior Stylist",
  "Stylist",
  "Junior Stylist",
  "Barber",
  "Nail Artist",
  "Beautician",
  "Receptionist",
];

export const STAFF_DAY_LABELS: Record<StaffDayOfWeek, string> = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

export const STAFF_DAYS: StaffDayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export const STAFF_BREAK_TYPES: { id: StaffBreakType; label: string }[] = [
  { id: "lunch", label: "Lunch" },
  { id: "coffee", label: "Coffee Break" },
  { id: "custom", label: "Custom Break" },
];

export const STAFF_LEAVE_TYPES: { id: StaffLeaveType; label: string }[] = [
  { id: "annual", label: "Annual Leave" },
  { id: "sick", label: "Sick Leave" },
  { id: "holiday", label: "Holiday" },
  { id: "custom", label: "Custom Leave" },
];

export const STAFF_LANGUAGE_OPTIONS = [
  "English",
  "Mandarin",
  "Cantonese",
  "Korean",
  "Vietnamese",
  "Japanese",
  "Hindi",
  "Spanish",
] as const;

/** Default Mon–Sat 9–17, Sunday off — booking engine baseline. */
export function defaultWorkingHours(): StaffWorkingDay[] {
  return STAFF_DAYS.map((day) => ({
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "17:00",
    isDayOff: day === 6,
  }));
}

export function staffDisplayName(input: {
  displayName?: string;
  firstName: string;
  lastName: string;
}): string {
  const custom = input.displayName?.trim();
  if (custom) return custom;
  return `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
}

/**
 * Working minutes for a day minus breaks — booking slot capacity helper.
 */
export function getWorkingMinutesForDay(
  day: StaffWorkingDay,
  breaks: { dayOfWeek: StaffDayOfWeek; startTime: string; endTime: string }[],
): number {
  if (day.isDayOff) return 0;
  const span = minutesBetween(day.startTime, day.endTime);
  const breakMins = breaks
    .filter((b) => b.dayOfWeek === day.dayOfWeek)
    .reduce((sum, b) => sum + minutesBetween(b.startTime, b.endTime), 0);
  return Math.max(0, span - breakMins);
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}
