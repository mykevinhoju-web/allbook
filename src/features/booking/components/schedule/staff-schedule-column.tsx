"use client";

import { AppAvatar } from "@/components/common";
import { cn } from "@/lib/utils";

import type { AdminBooking } from "../../types/admin-booking";
import { BookingSummaryList } from "./booking-summary-list";

interface StaffScheduleColumnProps {
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
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-[min(100%,220px)] min-w-[180px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-soft transition",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/60 hover:border-primary/30",
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5">
        <AppAvatar src={photoUrl} alt={name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-[10px] text-muted-foreground">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"} today
          </p>
        </div>
      </div>

      <div className="min-h-28 flex-1 px-2 py-2">
        <BookingSummaryList bookings={sorted} compact />
      </div>

      <div className="border-t border-border/40 px-3 py-2 text-center text-[10px] font-medium text-primary">
        Tap for times & availability
      </div>
    </button>
  );
}
