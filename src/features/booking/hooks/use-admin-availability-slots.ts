"use client";

import { useEffect, useMemo, useState } from "react";

import {
  hasAnyRoomAvailable,
  pickFirstAvailableRoom,
  type RoomOption,
  type RoomSlotBooking,
} from "../lib/room-availability";
import {
  DEFAULT_BOOKING_TIMEZONE,
  datetimeLocalToIso,
  formatAmPmTime,
  isoToDatetimeLocal,
  todayDateInZone,
} from "../lib/schedule-utils";
import type { BookingTimeSlotOption } from "../components/schedule/booking-form-sheet";

const EMPTY_ROOM_BOOKINGS: { startsAt: string; endsAt: string }[] = [];
const EMPTY_ROOMS: RoomOption[] = [];
const EMPTY_ALL_ROOM_BOOKINGS: RoomSlotBooking[] = [];

interface StaffSlot {
  startsAt: string;
  label: string;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Every 5 minutes from current time (today) or day start (future) through 23:55. */
function buildOpenDaySlots(
  date: string,
  timeZone: string,
  durationMinutes: number,
): StaffSlot[] {
  const durationMs = durationMinutes * 60_000;
  const today = todayDateInZone(timeZone);
  const dayEndMs = new Date(
    datetimeLocalToIso(`${date}T23:59`, timeZone),
  ).getTime();

  let hour = 0;
  let minute = 0;

  if (date === today) {
    const nowLocal = isoToDatetimeLocal(new Date().toISOString(), timeZone);
    hour = Number(nowLocal.slice(11, 13));
    minute = Number(nowLocal.slice(14, 16));
    // Round up to next 5-minute step (allow current minute if already on step).
    const rem = minute % 5;
    if (rem !== 0) {
      minute += 5 - rem;
      if (minute >= 60) {
        hour += 1;
        minute = 0;
      }
    }
  }

  if (hour > 23) return [];

  const slots: StaffSlot[] = [];
  for (let h = hour; h <= 23; h++) {
    const startMinute = h === hour ? minute : 0;
    for (let m = startMinute; m < 60; m += 5) {
      const local = `${date}T${pad2(h)}:${pad2(m)}`;
      const startsAt = datetimeLocalToIso(local, timeZone);
      const startMs = new Date(startsAt).getTime();
      if (startMs + durationMs > dayEndMs + 60_000) continue;
      slots.push({
        startsAt,
        label: formatAmPmTime(startsAt),
      });
    }
  }
  return slots;
}

interface UseAdminAvailabilitySlotsArgs {
  staffId: string;
  durationMinutes: string;
  date: string;
  timeZone?: string;
  /** When set, exclude times that overlap bookings in this room. */
  roomId?: string;
  roomBookings?: { startsAt: string; endsAt: string }[];
  /** Active rooms for auto-assign filtering. */
  rooms?: RoomOption[];
  /** All room bookings on the selected day (for auto-assign). */
  allRoomBookings?: RoomSlotBooking[];
  /** Out call: keep staff times, ignore room occupancy. */
  skipRoomAvailability?: boolean;
  /** Other staff: open all remaining times from now (no roster). */
  openAllDaySlots?: boolean;
}

export function useAdminAvailabilitySlots({
  staffId,
  durationMinutes,
  date,
  timeZone = DEFAULT_BOOKING_TIMEZONE,
  roomId,
  roomBookings = EMPTY_ROOM_BOOKINGS,
  rooms = EMPTY_ROOMS,
  allRoomBookings = EMPTY_ALL_ROOM_BOOKINGS,
  skipRoomAvailability = false,
  openAllDaySlots = false,
}: UseAdminAvailabilitySlotsArgs) {
  const [rawSlots, setRawSlots] = useState<StaffSlot[]>([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [fetchHint, setFetchHint] = useState<string | null>(null);

  useEffect(() => {
    if (!staffId || !durationMinutes || !date) {
      setRawSlots([]);
      setFetchHint(null);
      setTimeSlotsLoading(false);
      return;
    }

    if (openAllDaySlots) {
      setRawSlots(
        buildOpenDaySlots(date, timeZone, Number(durationMinutes) || 30),
      );
      setFetchHint(null);
      setTimeSlotsLoading(false);
      return;
    }

    let cancelled = false;
    setTimeSlotsLoading(true);
    setFetchHint(null);

    void (async () => {
      try {
        const params = new URLSearchParams({
          staffId,
          durationMinutes,
          date,
        });
        const response = await fetch(`/api/booking/availability?${params}`);
        const data = (await response.json()) as {
          slots?: StaffSlot[];
          reason?: string | null;
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok) {
          setRawSlots([]);
          setFetchHint(data.error ?? "Could not load times.");
          return;
        }

        setRawSlots(data.slots ?? []);
        setFetchHint(data.reason ?? null);
      } catch {
        if (!cancelled) {
          setRawSlots([]);
          setFetchHint("Could not load times.");
        }
      } finally {
        if (!cancelled) setTimeSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [staffId, durationMinutes, date, timeZone, openAllDaySlots]);

  const timeSlotOptions = useMemo(() => {
    if (rawSlots.length === 0) return [];

    const durationMs = Number(durationMinutes) * 60_000;
    const earliestMs = openAllDaySlots
      ? Date.now() - 60_000
      : Date.now() + 5 * 60_000;

    return rawSlots
      .filter((slot) => {
        const start = new Date(slot.startsAt).getTime();
        if (start < earliestMs) return false;

        const localDate = isoToDatetimeLocal(slot.startsAt, timeZone).slice(
          0,
          10,
        );
        if (localDate !== date) return false;

        if (skipRoomAvailability) return true;

        const end = start + durationMs;

        if (roomId) {
          return !roomBookings.some((booking) => {
            const bookingStart = new Date(booking.startsAt).getTime();
            const bookingEnd = new Date(booking.endsAt).getTime();
            return start < bookingEnd && end > bookingStart;
          });
        }

        if (rooms.length > 0) {
          return hasAnyRoomAvailable(rooms, start, end, allRoomBookings);
        }

        return true;
      })
      .map((slot) => {
        const start = new Date(slot.startsAt).getTime();
        const end = start + durationMs;
        const suggestedRoom =
          !skipRoomAvailability && !roomId && rooms.length > 0
            ? pickFirstAvailableRoom(rooms, start, end, allRoomBookings)
            : null;

        return {
          value: slot.startsAt,
          label: slot.label,
          groupTime: isoToDatetimeLocal(slot.startsAt, timeZone).slice(11, 16),
          suggestedRoomName: suggestedRoom?.name,
        };
      });
  }, [
    rawSlots,
    durationMinutes,
    date,
    timeZone,
    roomId,
    roomBookings,
    rooms,
    allRoomBookings,
    skipRoomAvailability,
    openAllDaySlots,
  ]);

  const timeSlotsHint = useMemo(() => {
    if (timeSlotsLoading) return null;
    if (fetchHint && rawSlots.length === 0) return fetchHint;
    if (timeSlotOptions.length > 0) return null;
    if (openAllDaySlots) {
      return skipRoomAvailability
        ? "No open times left today."
        : "No open times — all rooms may be booked.";
    }
    if (skipRoomAvailability) {
      return fetchHint ?? "No open times for this staff.";
    }
    if (roomId) return "No open times for this staff and room.";
    return fetchHint ?? "No open times — staff or all rooms may be booked.";
  }, [
    timeSlotsLoading,
    fetchHint,
    rawSlots.length,
    timeSlotOptions.length,
    skipRoomAvailability,
    openAllDaySlots,
    roomId,
  ]);

  return { timeSlotOptions, timeSlotsLoading, timeSlotsHint };
}
