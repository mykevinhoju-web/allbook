"use client";

import { ChevronRight } from "lucide-react";

import { AppAvatar } from "@/components/common";
import { formatPriceFromCents } from "@/features/services";
import { cn } from "@/lib/utils";

import { formatAmPmTime, formatBookingSummary } from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";

interface StaffScheduleColumnProps {
  name: string;
  photoUrl?: string;
  bookings: AdminBooking[];
  currency?: string;
  selected?: boolean;
  onSelect?: () => void;
}

export function StaffScheduleColumn({
  name,
  photoUrl,
  bookings,
  currency = "AUD",
  selected,
  onSelect,
}: StaffScheduleColumnProps) {
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const nextBooking = sorted[0];
  const upcomingCount = sorted.length;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-soft transition active:scale-[0.99]",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/60 hover:border-primary/30",
      )}
    >
      <AppAvatar src={photoUrl} alt={name} size="lg" className="shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-base font-semibold tracking-tight">
            {name}
          </p>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {upcomingCount} today
          </span>
        </div>

        {nextBooking ? (
          <p className="mt-1 truncate text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatAmPmTime(nextBooking.startsAt)}
            </span>
            {" · "}
            {formatBookingSummary(nextBooking)}
            {nextBooking.priceCents > 0
              ? ` · ${formatPriceFromCents(nextBooking.priceCents, currency)}`
              : ""}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            No bookings · tap to add
          </p>
        )}

        {upcomingCount > 1 ? (
          <p className="mt-0.5 text-xs text-primary">
            +{upcomingCount - 1} more booking
            {upcomingCount - 1 === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
