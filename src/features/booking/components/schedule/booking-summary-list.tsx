"use client";

import { formatPriceFromCents } from "@/features/services";
import { cn } from "@/lib/utils";

import { formatBookingSummary } from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";

interface BookingSummaryListProps {
  bookings: AdminBooking[];
  currency?: string;
  compact?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function BookingSummaryList({
  bookings,
  currency = "AUD",
  compact = false,
  emptyMessage = "No bookings yet",
  className,
}: BookingSummaryListProps) {
  if (bookings.length === 0) {
    return (
      <p
        className={cn(
          "text-muted-foreground",
          compact ? "px-3 py-4 text-xs" : "text-sm",
          className,
        )}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {bookings.map((booking) => (
        <li
          key={booking.id}
          className={cn(
            "rounded-lg border border-border/50 bg-background/80",
            compact ? "px-2.5 py-2 text-[11px] leading-snug" : "px-3 py-2.5 text-sm",
          )}
        >
          <p className="font-medium text-foreground">
            {formatBookingSummary(booking)}
            {booking.priceCents > 0
              ? ` · ${formatPriceFromCents(booking.priceCents, currency)}`
              : ""}
          </p>
          {!compact && booking.customerName ? (
            <p className="mt-0.5 text-muted-foreground">{booking.customerName}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
