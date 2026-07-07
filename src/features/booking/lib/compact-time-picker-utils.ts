import type { BookingTimeSlotOption } from "../components/schedule/booking-form-sheet";
import {
  buildStartsAtIso,
  formatAmPmTime,
  formatDurationLabel,
  isoToDatetimeLocal,
  isIsoDateTime,
} from "./schedule-utils";

export interface CompactHourGroup {
  key: string;
  hourLabel: string;
  slots: BookingTimeSlotOption[];
}

export interface CompactMinuteOption {
  minute: string;
  label: string;
  value: string;
  suggestedRoomName?: string;
}

export function slotToIso(
  date: string,
  value: string,
): string {
  return isIsoDateTime(value) ? value : buildStartsAtIso(date, value);
}

export function buildCompactHourGroups(
  slotOptions: BookingTimeSlotOption[],
  timeZone: string,
  date: string,
): CompactHourGroup[] {
  const map = new Map<string, CompactHourGroup>();

  for (const slot of slotOptions) {
    const iso = slotToIso(date, slot.value);
    const local = isoToDatetimeLocal(iso, timeZone);
    const dateKey = local.slice(0, 10);
    const hour = Number(local.slice(11, 13));
    const key = `${dateKey}-${hour}`;

    const hourStartIso = buildStartsAtIso(dateKey, `${String(hour).padStart(2, "0")}:00`);
    const hourLabel =
      dateKey !== date
        ? `${formatAmPmTime(hourStartIso)} · ${formatShortWeekday(dateKey)}`
        : formatAmPmTime(hourStartIso);

    const existing = map.get(key);
    if (existing) {
      existing.slots.push(slot);
    } else {
      map.set(key, { key, hourLabel, slots: [slot] });
    }
  }

  return [...map.values()].sort((a, b) => {
    const aIso = slotToIso(date, a.slots[0]?.value ?? "");
    const bIso = slotToIso(date, b.slots[0]?.value ?? "");
    return new Date(aIso).getTime() - new Date(bIso).getTime();
  });
}

export function minutesForHourGroup(
  group: CompactHourGroup | undefined,
  date: string,
  timeZone: string,
): CompactMinuteOption[] {
  if (!group) return [];

  return group.slots
    .map((slot) => {
      const iso = slotToIso(date, slot.value);
      const local = isoToDatetimeLocal(iso, timeZone);
      const minute = local.slice(14, 16);
      return {
        minute,
        label: formatAmPmTime(iso),
        value: iso,
        suggestedRoomName: slot.suggestedRoomName,
      };
    })
    .sort(
      (a, b) =>
        Number(a.minute) - Number(b.minute) ||
        new Date(a.value).getTime() - new Date(b.value).getTime(),
    );
}

export function findHourKeyForValue(
  slotOptions: BookingTimeSlotOption[],
  selectedValue: string,
  timeZone: string,
  date: string,
): string | null {
  if (!selectedValue) return null;

  const iso = slotToIso(date, selectedValue);
  const local = isoToDatetimeLocal(iso, timeZone);
  return `${local.slice(0, 10)}-${Number(local.slice(11, 13))}`;
}

export function formatCompactEndTime(
  startsAtIso: string,
  durationMinutes: number,
  timeZone: string,
): string {
  const startMs = new Date(startsAtIso).getTime();
  const endIso = new Date(startMs + durationMinutes * 60_000).toISOString();
  const startDate = isoToDatetimeLocal(startsAtIso, timeZone).slice(0, 10);
  const endDate = isoToDatetimeLocal(endIso, timeZone).slice(0, 10);

  if (startDate === endDate) {
    return formatAmPmTime(endIso);
  }

  return `${formatShortWeekday(endDate)} ${formatAmPmTime(endIso)}`;
}

export function formatCompactStartTime(
  startsAtIso: string,
  timeZone: string,
  anchorDate: string,
): string {
  const local = isoToDatetimeLocal(startsAtIso, timeZone);
  const dateKey = local.slice(0, 10);
  const time = formatAmPmTime(startsAtIso);

  if (dateKey !== anchorDate) {
    return `${formatShortWeekday(dateKey)} ${time}`;
  }

  return time;
}

function formatShortWeekday(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDurationSummary(durationMinutes: number): string {
  return formatDurationLabel(durationMinutes);
}
