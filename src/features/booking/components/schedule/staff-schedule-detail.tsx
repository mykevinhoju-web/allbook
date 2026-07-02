"use client";

import {
  formatScheduleDate,
  formatScheduleTime,
} from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";
import { BookingBlock } from "./booking-block";

interface StaffScheduleDetailProps {
  staffName: string;
  date: string;
  bookings: AdminBooking[];
}

export function StaffScheduleDetail({
  staffName,
  date,
  bookings,
}: StaffScheduleDetailProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-semibold">{staffName}</p>
        <p className="text-sm text-muted-foreground">
          {formatScheduleDate(`${date}T12:00:00`)} · 24-hour schedule
        </p>
      </div>

      <div className="relative h-[70vh] min-h-[28rem] overflow-hidden rounded-2xl border border-border/60 bg-muted/10">
        {Array.from({ length: 25 }).map((_, hour) => (
          <div
            key={hour}
            className="absolute inset-x-0 border-t border-border/30"
            style={{ top: `${(hour / 24) * 100}%` }}
          />
        ))}

        <div className="absolute inset-y-0 left-0 z-10 w-14 border-r border-border/40 bg-background/80">
          {Array.from({ length: 25 }).map((_, hour) => (
            <span
              key={hour}
              className="absolute left-2 -translate-y-1/2 text-xs text-muted-foreground"
              style={{ top: `${(hour / 24) * 100}%` }}
            >
              {String(hour).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        <div className="absolute inset-y-0 left-14 right-0">
          {bookings.map((booking) => (
            <BookingBlock key={booking.id} booking={booking} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings for this day.</p>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">
                  {formatScheduleTime(booking.startsAt)} –{" "}
                  {formatScheduleTime(booking.endsAt)}
                </p>
                <span className="text-muted-foreground">
                  {booking.durationMinutes} min
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Room: {booking.roomName ?? "Unassigned"}
                {booking.customerName ? ` · ${booking.customerName}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
