"use client";

import { AppAvatar } from "@/components/common";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { StaffRecord } from "@/features/staff/types";

import {
  activeBookingsForStaff,
  getStaffShiftBand,
  msToBarPercent,
  snapMsToGridStep,
  type ScheduleGridWindow,
} from "../../lib/schedule-grid-utils";
import { formatAmPmTime } from "../../lib/schedule-utils";
import { isBookingOccupyingRoom } from "../../lib/room-occupancy";
import { formatTimelineMarkerNumber } from "../../lib/timeline-marker-number";
import type { AdminBooking } from "../../types/admin-booking";

function splitIntoTwoColumns<T>(items: T[]): [T[], T[]] {
  if (items.length <= 3) {
    return [items, []];
  }

  const splitAt = Math.ceil(items.length / 2);
  return [items.slice(0, splitAt), items.slice(splitAt)];
}

interface BookingTimelineListProps {
  markers: {
    booking: AdminBooking;
    index: number;
  }[];
  isMobile: boolean;
  onBookingSelect?: (booking: AdminBooking) => void;
}

function BookingTimelineList({
  markers,
  isMobile,
  onBookingSelect,
}: BookingTimelineListProps) {
  if (markers.length === 0) {
    return (
      <p className="mt-2 text-center text-xs text-muted-foreground">
        No bookings · tap the line to add
      </p>
    );
  }

  const [leftColumn, rightColumn] = isMobile
    ? [markers, []]
    : splitIntoTwoColumns(markers);

  const renderItem = ({
    booking,
    index,
  }: {
    booking: AdminBooking;
    index: number;
  }) => (
    <li key={booking.id}>
      <button
        type="button"
        onClick={() => onBookingSelect?.(booking)}
        className="flex w-full min-w-0 items-baseline gap-1.5 text-left"
      >
        {isMobile ? (
          <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
            {formatTimelineMarkerNumber(index)}.
          </span>
        ) : null}
        <span className="min-w-0 truncate text-xs font-semibold text-primary">
          {booking.customerName ?? "Walk-in"}
        </span>
        <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
          {formatAmPmTime(booking.startsAt)} ({booking.durationMinutes}min)
        </span>
      </button>
    </li>
  );

  return (
    <div
      className={cn(
        "mt-2 gap-x-4 gap-y-0.5 border-t border-border/40 pt-2",
        rightColumn.length > 0 ? "grid grid-cols-2" : "grid grid-cols-1",
      )}
    >
      <ul className="min-w-0 space-y-1">{leftColumn.map(renderItem)}</ul>
      {rightColumn.length > 0 ? (
        <ul className="min-w-0 space-y-1">{rightColumn.map(renderItem)}</ul>
      ) : null}
    </div>
  );
}

interface StaffBookingTimelineProps {
  date: string;
  staff: StaffRecord[];
  bookings: AdminBooking[];
  timeZone: string;
  onStaffSelect?: (staffId: string) => void;
  onSlotSelect?: (staffId: string, startsAtIso: string) => void;
  onBookingSelect?: (booking: AdminBooking) => void;
  className?: string;
}

interface StaffTimelineRowProps {
  member: StaffRecord;
  date: string;
  bookings: AdminBooking[];
  timeZone: string;
  isMobile: boolean;
  onStaffSelect?: (staffId: string) => void;
  onSlotSelect?: (staffId: string, startsAtIso: string) => void;
  onBookingSelect?: (booking: AdminBooking) => void;
}

function shiftWindowFromBand(
  startMs: number,
  endMs: number,
): ScheduleGridWindow {
  return { startMs, endMs };
}

function StaffTimelineRow({
  member,
  date,
  bookings,
  timeZone,
  isMobile,
  onStaffSelect,
  onSlotSelect,
  onBookingSelect,
}: StaffTimelineRowProps) {
  const now = new Date();
  const shift = getStaffShiftBand(member, date, timeZone, now);

  if (!shift) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card px-4 py-5 text-sm text-muted-foreground shadow-soft">
        <div className="flex items-center gap-3">
          <AppAvatar
            src={member.photoUrl ?? member.photos[0]?.url}
            alt={member.name}
            size="default"
          />
          <p className="font-semibold text-foreground">{member.name}</p>
        </div>
        <p className="mt-2">No availability window for this day.</p>
      </div>
    );
  }

  const window = shiftWindowFromBand(shift.startMs, shift.endMs);
  const staffBookings = activeBookingsForStaff(bookings, member.id, window, {
    strictWindow: false,
    includeCompleted: true,
  });

  const markers = staffBookings.map((booking, index) => ({
    booking,
    index,
    percent: msToBarPercent(
      new Date(booking.startsAt).getTime(),
      shift.startMs,
      shift.endMs,
    ),
  }));

  const handleBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSlotSelect) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const ms = shift.startMs + ratio * (shift.endMs - shift.startMs);
    const snapped = snapMsToGridStep(ms, window);
    onSlotSelect(member.id, new Date(snapped).toISOString());
  };

  return (
    <article className="rounded-2xl border border-border/40 bg-card px-4 py-4 shadow-soft">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onStaffSelect?.(member.id)}
          className="flex min-w-0 shrink-0 items-center gap-3 text-left transition hover:opacity-80"
        >
          <AppAvatar
            src={member.photoUrl ?? member.photos[0]?.url}
            alt={member.name}
            size="default"
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-primary">
              {member.name}
            </p>
            {markers.length > 0 ? (
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Booked
              </p>
            ) : null}
          </div>
        </button>

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-bold tabular-nums leading-none">
              {formatAmPmTime(new Date(shift.startMs).toISOString())}
            </p>
            <p className="text-lg font-bold tabular-nums leading-none">
              {formatAmPmTime(new Date(shift.endMs).toISOString())}
            </p>
          </div>

          <div
            className={cn("relative mt-3 cursor-pointer", isMobile ? "h-10" : "h-8")}
            onClick={handleBarClick}
            role="presentation"
          >
            <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />

            <span className="absolute left-0 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background" />
            <span className="absolute right-0 top-1/2 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary" />

            {markers.map(({ booking, index, percent }) => {
              const inProgress = isBookingOccupyingRoom(booking, now);
              const markerNumber = formatTimelineMarkerNumber(index);

              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onBookingSelect?.(booking);
                  }}
                  className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${percent}%` }}
                  aria-label={`${markerNumber} ${booking.customerName ?? "Booking"} ${formatAmPmTime(booking.startsAt)}`}
                >
                  {isMobile ? (
                    <span
                      className={cn(
                        "text-sm font-bold leading-none",
                        inProgress ? "text-amber-500" : "text-primary",
                      )}
                    >
                      {markerNumber}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "block size-2.5 rounded-full ring-2 ring-card",
                        inProgress ? "bg-amber-500" : "bg-foreground",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <BookingTimelineList
            markers={markers}
            isMobile={isMobile}
            onBookingSelect={onBookingSelect}
          />
        </div>
      </div>
    </article>
  );
}

export function StaffBookingTimeline({
  date,
  staff,
  bookings,
  timeZone,
  onStaffSelect,
  onSlotSelect,
  onBookingSelect,
  className,
}: StaffBookingTimelineProps) {
  const isMobile = useIsMobile();

  if (staff.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {staff.map((member) => (
        <StaffTimelineRow
          key={member.id}
          member={member}
          date={date}
          bookings={bookings}
          timeZone={timeZone}
          isMobile={isMobile}
          onStaffSelect={onStaffSelect}
          onSlotSelect={onSlotSelect}
          onBookingSelect={onBookingSelect}
        />
      ))}

      <p className="px-1 text-center text-[10px] text-muted-foreground">
        {isMobile
          ? "Numbers on the bar match the list below · tap for details · tap the line to add"
          : "Dots on the bar · list below in time order · tap for details · tap the line to add"}
      </p>
    </div>
  );
}
