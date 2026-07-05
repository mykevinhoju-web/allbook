"use client";

import { useEffect, useState } from "react";

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
}

export function useAdminAvailabilitySlots({
  staffId,
  durationMinutes,
  date,
  timeZone = DEFAULT_BOOKING_TIMEZONE,
  roomId,
  roomBookings = [],
}: UseAdminAvailabilitySlotsArgs) {
  const [timeSlotOptions, setTimeSlotOptions] = useState<
    BookingTimeSlotOption[]
  >([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [timeSlotsHint, setTimeSlotsHint] = useState<string | null>(null);

  useEffect(() => {
    if (!staffId || !durationMinutes) {
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
            const local = isoToDatetimeLocal(slot.startsAt, timeZone);
            if (!local.startsWith(date)) return false;

            if (!roomId) return true;

            const start = new Date(slot.startsAt).getTime();
            const end = start + durationMs;
            return !roomBookings.some((booking) => {
              const bookingStart = new Date(booking.startsAt).getTime();
              const bookingEnd = new Date(booking.endsAt).getTime();
              return start < bookingEnd && end > bookingStart;
            });
          })
          .map((slot) => ({
            value: isoToDatetimeLocal(slot.startsAt, timeZone).slice(11, 16),
            label: slot.label,
          }));

        setTimeSlotOptions(options);
        setTimeSlotsHint(
          options.length === 0
            ? (data.reason ?? "No open times for this staff on this day.")
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
  ]);

  return { timeSlotOptions, timeSlotsLoading, timeSlotsHint };
}
