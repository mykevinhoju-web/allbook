/**
 * Public booking slot generation (wraps the pure engine).
 */
import { generateTimeSlots } from "./generateTimeSlots";
import { openingHoursForDate } from "./opening-hours";
import type { BookingCatalogStaff, BookingSalonContext } from "./catalog-types";
import { NO_PREFERENCE_STAFF_ID } from "./catalog-types";
import {
  getDayOfWeekMondayFirst,
  isDateInLeaveRange,
} from "./time-utils";
import type {
  ExistingBookingBlock,
  GenerateTimeSlotsInput,
  TimeSlot,
} from "./types";

export { generateTimeSlots };

export type GenerateAvailableSlotsOptions = {
  context: BookingSalonContext;
  staffId: string | null;
  serviceId?: string;
  serviceDuration: number;
  date: string;
  existingBookingsByStaff?: Record<string, ExistingBookingBlock[]>;
};

export function buildAvailabilityInput(options: {
  context: BookingSalonContext;
  staff: BookingCatalogStaff;
  serviceDuration: number;
  date: string;
  existingBookings?: ExistingBookingBlock[];
}): GenerateTimeSlotsInput {
  const day = getDayOfWeekMondayFirst(options.date);
  const businessHours = openingHoursForDate(
    options.context.openingHours,
    options.date,
  );

  const hoursRow = options.staff.workingHours.find((h) => h.dayOfWeek === day);
  const staffHours = hoursRow
    ? {
        startTime: hoursRow.startTime,
        endTime: hoursRow.endTime,
        isDayOff: hoursRow.isDayOff,
      }
    : businessHours.closed
      ? { startTime: "09:00", endTime: "17:00", isDayOff: true }
      : {
          startTime: businessHours.open,
          endTime: businessHours.close,
          isDayOff: false,
        };

  return {
    date: options.date,
    serviceDurationMinutes: options.serviceDuration,
    bufferMinutes: options.staff.bufferMinutes,
    businessHours,
    staffHours,
    staffBreaks: options.staff.breaks
      .filter((b) => b.dayOfWeek === day)
      .map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    staffLeaves: options.staff.leaves,
    existingBookings: options.existingBookings ?? [],
  };
}

export function resolveStaffCandidates(
  options: Pick<GenerateAvailableSlotsOptions, "context" | "staffId"> & {
    serviceId?: string;
  },
): BookingCatalogStaff[] {
  const forService = options.context.staff.filter((s) => {
    if (!s.bookingEnabled) return false;
    if (options.serviceId && !s.serviceIds.includes(options.serviceId)) {
      return false;
    }
    return true;
  });

  if (!options.staffId || options.staffId === NO_PREFERENCE_STAFF_ID) {
    return forService;
  }

  return forService.filter((s) => s.id === options.staffId);
}

/**
 * Generate available slots for a staff member, or union for "No preference".
 */
export function generateAvailableSlots(
  options: GenerateAvailableSlotsOptions,
): TimeSlot[] {
  const candidates = resolveStaffCandidates(options);
  if (candidates.length === 0) return [];

  if (candidates.length === 1) {
    const staff = candidates[0]!;
    const input = buildAvailabilityInput({
      context: options.context,
      staff,
      serviceDuration: options.serviceDuration,
      date: options.date,
      existingBookings:
        options.existingBookingsByStaff?.[staff.id] ??
        options.context.seedBookingsByStaffDate[`${staff.id}:${options.date}`] ??
        [],
    });
    return generateTimeSlots(input);
  }

  const slotMap = new Map<string, TimeSlot>();
  for (const staff of candidates) {
    const input = buildAvailabilityInput({
      context: options.context,
      staff,
      serviceDuration: options.serviceDuration,
      date: options.date,
      existingBookings:
        options.existingBookingsByStaff?.[staff.id] ??
        options.context.seedBookingsByStaffDate[`${staff.id}:${options.date}`] ??
        [],
    });
    for (const slot of generateTimeSlots(input)) {
      if (!slotMap.has(slot.startTime)) {
        slotMap.set(slot.startTime, slot);
      }
    }
  }

  return [...slotMap.values()].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
}

/** Pick first staff who still has the chosen start time free. */
export function pickStaffForSlot(options: {
  context: BookingSalonContext;
  staffId: string | null;
  serviceId: string;
  serviceDuration: number;
  date: string;
  startTime: string;
  existingBookingsByStaff?: Record<string, ExistingBookingBlock[]>;
}): { staff: BookingCatalogStaff; availability: GenerateTimeSlotsInput } | null {
  const candidates = resolveStaffCandidates({
    context: options.context,
    staffId: options.staffId,
    serviceId: options.serviceId,
  });

  for (const staff of candidates) {
    const availability = buildAvailabilityInput({
      context: options.context,
      staff,
      serviceDuration: options.serviceDuration,
      date: options.date,
      existingBookings:
        options.existingBookingsByStaff?.[staff.id] ??
        options.context.seedBookingsByStaffDate[`${staff.id}:${options.date}`] ??
        [],
    });
    const slots = generateTimeSlots(availability);
    if (slots.some((s) => s.startTime === options.startTime && s.available)) {
      return { staff, availability };
    }
  }
  return null;
}

/** Whether a calendar date should be disabled for the current selection. */
export function isBookingDateDisabled(options: {
  context: BookingSalonContext;
  staffId: string | null;
  serviceId: string;
  date: string;
  todayIso: string;
}): boolean {
  if (options.date < options.todayIso) return true;

  const business = openingHoursForDate(
    options.context.openingHours,
    options.date,
  );
  if (business.closed) return true;

  const candidates = resolveStaffCandidates({
    context: options.context,
    staffId: options.staffId,
    serviceId: options.serviceId,
  });
  if (candidates.length === 0) return true;

  const allOnLeave = candidates.every((staff) =>
    staff.leaves.some((leave) => isDateInLeaveRange(options.date, leave)),
  );
  if (allOnLeave) return true;

  const day = getDayOfWeekMondayFirst(options.date);
  const allDayOff = candidates.every((staff) => {
    const hours = staff.workingHours.find((h) => h.dayOfWeek === day);
    if (!hours) return false;
    return hours.isDayOff;
  });
  return allDayOff;
}
