const MINUTES_IN_DAY = 24 * 60;

export function minutesFromIso(iso: string): number {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

export function formatScheduleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatScheduleDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function topPercentForMinute(minute: number): number {
  return (minute / MINUTES_IN_DAY) * 100;
}

export function heightPercentForDuration(durationMinutes: number): number {
  return (durationMinutes / MINUTES_IN_DAY) * 100;
}

export function todayDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isWorkingToday(workingDays: string[], date = new Date()): boolean {
  const dayCodes = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return workingDays.includes(dayCodes[date.getDay()] ?? "");
}

export { MINUTES_IN_DAY };
