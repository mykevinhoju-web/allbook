"use client";

import { AppAvatar } from "@/components/common";
import { cn } from "@/lib/utils";

import type { AdminBooking } from "../../types/admin-booking";
import { BookingBlock } from "./booking-block";

interface StaffScheduleColumnProps {
  staffId: string;
  name: string;
  photoUrl?: string;
  bookings: AdminBooking[];
  selected?: boolean;
  onSelect?: () => void;
}

export function StaffScheduleColumn({
  name,
  photoUrl,
  bookings,
  selected,
  onSelect,
}: StaffScheduleColumnProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-w-[108px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-soft transition",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/60 hover:border-primary/30",
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
        <AppAvatar src={photoUrl} alt={name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-[10px] text-muted-foreground">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="relative h-72 bg-muted/20">
        {Array.from({ length: 25 }).map((_, hour) => (
          <div
            key={hour}
            className="absolute inset-x-0 border-t border-border/30"
            style={{ top: `${(hour / 24) * 100}%` }}
          />
        ))}

        {bookings.map((booking) => (
          <BookingBlock key={booking.id} booking={booking} compact />
        ))}

        <div className="pointer-events-none absolute inset-y-0 left-0 w-7 border-r border-border/30 bg-background/40">
          {[0, 6, 12, 18, 24].map((hour) => (
            <span
              key={hour}
              className="absolute left-1 -translate-y-1/2 text-[9px] text-muted-foreground"
              style={{ top: `${(hour / 24) * 100}%` }}
            >
              {String(hour).padStart(2, "0")}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
