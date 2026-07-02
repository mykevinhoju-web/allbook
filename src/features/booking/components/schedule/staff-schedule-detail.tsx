"use client";

import { useMemo, useState } from "react";

import { AppButton } from "@/components/common";
import { cn } from "@/lib/utils";
import type { StaffRecord } from "@/features/staff/types";

import {
  BOOKING_DURATION_OPTIONS,
  buildStartsAtIso,
  formatAmPmTime,
  formatBookingSummary,
  formatDurationLabel,
  formatScheduleDate,
  formatServiceDurationLabel,
  getAvailableStartSlots,
} from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";

interface StaffScheduleDetailProps {
  staff: StaffRecord;
  date: string;
  bookings: AdminBooking[];
  onAddBooking: (startsAt: string, durationMinutes: number) => void;
}

export function StaffScheduleDetail({
  staff,
  date,
  bookings,
  onAddBooking,
}: StaffScheduleDetailProps) {
  const [durationMinutes, setDurationMinutes] = useState(30);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [bookings],
  );

  const availableSlots = useMemo(
    () =>
      getAvailableStartSlots(
        date,
        staff.workingHoursStart,
        staff.workingHoursEnd,
        sortedBookings,
        durationMinutes,
      ),
    [
      date,
      durationMinutes,
      sortedBookings,
      staff.workingHoursEnd,
      staff.workingHoursStart,
    ],
  );

  return (
    <div className="space-y-6 pb-4">
      <div>
        <p className="text-lg font-semibold">{staff.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatScheduleDate(`${date}T12:00:00`)} · {staff.workingHoursStart} –{" "}
          {staff.workingHoursEnd}
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Booked times</h3>
        {sortedBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings for this day.</p>
        ) : (
          <div className="space-y-2">
            {sortedBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl border border-border/60 bg-card px-4 py-3"
              >
                <p className="text-sm font-medium">
                  {formatBookingSummary(booking)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Exact: {formatAmPmTime(booking.startsAt)} →{" "}
                  {formatAmPmTime(booking.endsAt)} ({booking.durationMinutes} min)
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {booking.customerName ?? "Walk-in"}
                  {booking.customerPhone ? ` · ${booking.customerPhone}` : ""}
                  {booking.roomName ? ` · ${booking.roomName}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold">Available times</h3>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Service</span>
            <select
              className="h-9 rounded-lg border border-border/60 bg-background px-2"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
            >
              {BOOKING_DURATION_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {formatServiceDurationLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {availableSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open {formatDurationLabel(durationMinutes)} slots in working hours.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((slot) => (
              <AppButton
                key={slot}
                type="button"
                variant="outline"
                size="sm"
                className={cn("rounded-full px-3")}
                onClick={() => onAddBooking(slot, durationMinutes)}
              >
                {formatAmPmTime(buildStartsAtIso(date, slot))}
              </AppButton>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Tap a time to book. Start times are in 5-minute steps; service length is
          20 min, 30 min, or 1 hour.
        </p>
      </section>
    </div>
  );
}
