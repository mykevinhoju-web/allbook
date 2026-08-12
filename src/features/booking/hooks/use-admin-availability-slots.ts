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
  isoToDatetimeLocal,
} from "../lib/schedule-utils";
import type { BookingTimeSlotOption } from "../components/schedule/booking-form-sheet";

const EMPTY_ROOM_BOOKINGS: { startsAt: string; endsAt: string }[] = [];
const EMPTY_ROOMS: RoomOption[] = [];
const EMPTY_ALL_ROOM_BOOKINGS: RoomSlotBooking[] = [];

interface StaffSlot {
  startsAt: string;
  label: string;
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
  }, [staffId, durationMinutes, date]);

  const timeSlotOptions = useMemo(() => {
    if (rawSlots.length === 0) return [];

    const durationMs = Number(durationMinutes) * 60_000;
    const earliestMs = Date.now() + 5 * 60_000;

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
  ]);

  const timeSlotsHint = useMemo(() => {
    if (timeSlotsLoading) return null;
    if (fetchHint && rawSlots.length === 0) return fetchHint;
    if (timeSlotOptions.length > 0) return null;
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
    roomId,
  ]);

  return { timeSlotOptions, timeSlotsLoading, timeSlotsHint };
}
