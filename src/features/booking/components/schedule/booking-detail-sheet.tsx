"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPriceFromCents } from "@/features/services";

import {
  formatAmPmTime,
  formatBookingSummary,
  formatDurationLabel,
  formatScheduleDate,
  formatShiftDateTime,
} from "../../lib/schedule-utils";
import { isBookingOccupyingRoom } from "../../lib/room-occupancy";
import type { AdminBooking } from "../../types/admin-booking";
import { BookingCheckoutButton } from "./booking-checkout-button";

interface BookingDetailSheetProps {
  booking: AdminBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: string;
  onCheckedOut?: () => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-3 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function BookingDetailSheet({
  booking,
  open,
  onOpenChange,
  currency = "AUD",
  onCheckedOut,
}: BookingDetailSheetProps) {
  if (!booking) return null;

  const inProgress = isBookingOccupyingRoom(booking);
  const priceLabel =
    booking.priceCents > 0
      ? formatPriceFromCents(booking.priceCents, currency)
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-[1.25rem] bg-muted/30 px-4 pb-8 pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        <SheetHeader className="px-1 pb-4 text-left">
          <SheetTitle className="text-xl font-semibold tracking-tight">
            Booking details
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {formatScheduleDate(booking.startsAt)}
            {inProgress ? (
              <span className="ml-2 text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
                In progress
              </span>
            ) : null}
          </p>
        </SheetHeader>

        <div className="rounded-2xl border border-border/40 bg-card px-4 shadow-soft">
          <DetailRow label="Time" value={formatBookingSummary(booking)} />
          <DetailRow
            label="Staff"
            value={booking.staffName}
          />
          <DetailRow
            label="Customer"
            value={booking.customerName ?? "Walk-in"}
          />
          <DetailRow label="Phone" value={booking.customerPhone} />
          <DetailRow label="Email" value={booking.customerEmail} />
          <DetailRow label="Postcode" value={booking.customerPostcode} />
          <DetailRow label="Room" value={booking.roomName ?? "—"} />
          <DetailRow
            label="Service"
            value={formatDurationLabel(booking.durationMinutes)}
          />
          <DetailRow label="Price" value={priceLabel} />
          <DetailRow label="Status" value={booking.status} />
          <DetailRow
            label="Starts"
            value={formatShiftDateTime(booking.startsAt)}
          />
          <DetailRow
            label="Ends"
            value={formatShiftDateTime(booking.endsAt)}
          />
        </div>

        {inProgress && booking.roomId ? (
          <div className="mt-4">
            <BookingCheckoutButton
              bookingId={booking.id}
              roomName={booking.roomName}
              size="default"
              className="h-11 w-full rounded-xl"
              onCheckedOut={() => {
                onCheckedOut?.();
                onOpenChange(false);
              }}
            />
          </div>
        ) : null}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {formatAmPmTime(booking.startsAt)} – {formatAmPmTime(booking.endsAt)}
        </p>
      </SheetContent>
    </Sheet>
  );
}
