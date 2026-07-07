"use client";

import { useEffect, useState } from "react";

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
}

export function useAdminAvailabilitySlots({
  staffId,
  durationMinutes,
  date,
  timeZone = DEFAULT_BOOKING_TIMEZONE,
  roomId,
  roomBookings = [],
  rooms = [],
  allRoomBookings = [],
}: UseAdminAvailabilitySlotsArgs) {
  const [timeSlotOptions, setTimeSlotOptions] = useState<
    BookingTimeSlotOption[]
  >([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [timeSlotsHint, setTimeSlotsHint] = useState<string | null>(null);

  useEffect(() => {
    if (!staffId || !durationMinutes || !date) {
      setTimeSlotOptions([]);
      setTimeSlotsHint(null);
      setTimeSlotsLoading(false);
      return;
    }

    let cancelled = false;
    setTimeSlotsLoading(true);
    setTimeSlotsHint(null);

    void (async () => {
      try {
        const params = new URLSearchParams({
          staffId,
          durationMinutes,
          date,
        });
        const response = await fetch(`/api/booking/availability?${params}`);
        const data = (await response.json()) as {
          slots?: { startsAt: string; label: string }[];
          reason?: string | null;
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok) {
          setTimeSlotOptions([]);
          setTimeSlotsHint(data.error ?? "Could not load times.");
          return;
        }

        const durationMs = Number(durationMinutes) * 60_000;
        const options = (data.slots ?? [])
          .filter((slot) => {
            const start = new Date(slot.startsAt).getTime();
            const end = start + durationMs;

            if (roomId) {
              return !roomBookings.some((booking) => {
                const bookingStart = new Date(booking.startsAt).getTime();
                const bookingEnd = new Date(booking.endsAt).getTime();
                return start < bookingEnd && end > bookingStart;
              });
            }

            if (rooms.length > 0 && allRoomBookings.length >= 0) {
              return hasAnyRoomAvailable(rooms, start, end, allRoomBookings);
            }

            return true;
          })
          .map((slot) => {
            const start = new Date(slot.startsAt).getTime();
            const end = start + durationMs;
            const suggestedRoom =
              !roomId && rooms.length > 0
                ? pickFirstAvailableRoom(rooms, start, end, allRoomBookings)
                : null;

            return {
              value: slot.startsAt,
              label: slot.label,
              groupTime: isoToDatetimeLocal(slot.startsAt, timeZone).slice(
                11,
                16,
              ),
              suggestedRoomName: suggestedRoom?.name,
            };
          });

        setTimeSlotOptions(options);
        setTimeSlotsHint(
          options.length === 0
            ? roomId
              ? "No open times for this staff and room."
              : (data.reason ??
                "No open times — staff or all rooms may be booked.")
            : null,
        );
      } catch {
        if (!cancelled) {
          setTimeSlotOptions([]);
          setTimeSlotsHint("Could not load times.");
        }
      } finally {
        if (!cancelled) setTimeSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    staffId,
    durationMinutes,
    date,
    timeZone,
    roomId,
    roomBookings,
    rooms,
    allRoomBookings,
  ]);

  return { timeSlotOptions, timeSlotsLoading, timeSlotsHint };
}
