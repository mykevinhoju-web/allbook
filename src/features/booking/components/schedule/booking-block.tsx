"use client";

import { cn } from "@/lib/utils";

import {
  formatScheduleTime,
  heightPercentForDuration,
  topPercentForMinute,
} from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";

interface BookingBlockProps {
  booking: AdminBooking;
  compact?: boolean;
  onClick?: () => void;
}

export function BookingBlock({
  booking,
  compact = false,
  onClick,
}: BookingBlockProps) {
  const startMinute = new Date(booking.startsAt).getHours() * 60 +
    new Date(booking.startsAt).getMinutes();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute inset-x-1 overflow-hidden rounded-lg border border-primary/20 bg-primary/15 px-2 py-1 text-left text-primary shadow-sm transition hover:bg-primary/25",
        onClick && "cursor-pointer",
      )}
      style={{
        top: `${topPercentForMinute(startMinute)}%`,
        height: `${Math.max(heightPercentForDuration(booking.durationMinutes), compact ? 4 : 3)}%`,
      }}
    >
      <p className={cn("truncate font-medium", compact ? "text-[10px]" : "text-xs")}>
        {formatScheduleTime(booking.startsAt)}
      </p>
      {!compact ? (
        <p className="truncate text-[10px] opacity-80">
          {booking.durationMinutes}m · {booking.roomName ?? "Room TBD"}
        </p>
      ) : null}
    </button>
  );
}
