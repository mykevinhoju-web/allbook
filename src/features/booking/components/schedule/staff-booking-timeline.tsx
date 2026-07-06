"use client";

import { AppAvatar } from "@/components/common";
import { cn } from "@/lib/utils";
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
import type { AdminBooking } from "../../types/admin-booking";

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

function labelRowForPosition(
  percent: number,
  used: { percent: number; row: number }[],
): number {
  const collisionThreshold = 14;
  let row = 0;

  while (
    used.some(
      (entry) => entry.row === row && Math.abs(entry.percent - percent) < collisionThreshold,
    )
  ) {
    row += 1;
  }

  used.push({ percent, row });
  return row;
}

function StaffTimelineRow({
  member,
  date,
  bookings,
  timeZone,
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
  const staffBookings = activeBookingsForStaff(bookings, member.id, window);
  const usedLabelRows: { percent: number; row: number }[] = [];

  const markers = staffBookings.map((booking) => {
    const startMs = new Date(booking.startsAt).getTime();
    const percent = msToBarPercent(startMs, shift.startMs, shift.endMs);
    const row = labelRowForPosition(percent, usedLabelRows);
    return { booking, percent, row };
  });

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
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Booked
            </p>
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
            className="relative mt-3 h-8 cursor-pointer"
            onClick={handleBarClick}
            role="presentation"
          >
            <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />

            <span className="absolute left-0 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background" />
            <span className="absolute right-0 top-1/2 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary" />

            {markers.map(({ booking, percent }) => {
              const inProgress = isBookingOccupyingRoom(booking, now);

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
                  aria-label={`${booking.customerName ?? "Booking"} ${formatAmPmTime(booking.startsAt)}`}
                >
                  <span
                    className={cn(
                      "block size-2.5 rounded-full ring-2 ring-card",
                      inProgress ? "bg-amber-500" : "bg-foreground",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="relative mt-1 min-h-[2.5rem]">
            {markers.length === 0 ? (
              <p className="pt-1 text-center text-xs text-muted-foreground">
                No bookings · tap the line to add
              </p>
            ) : (
              markers.map(({ booking, percent, row }) => (
                <button
                  key={`${booking.id}-label`}
                  type="button"
                  onClick={() => onBookingSelect?.(booking)}
                  className="absolute w-24 -translate-x-1/2 text-center"
                  style={{
                    left: `${percent}%`,
                    top: row * 2.25 + "rem",
                  }}
                >
                  <p className="truncate text-xs font-semibold text-primary">
                    {booking.customerName ?? "Walk-in"}
                  </p>
                  <p className="truncate text-[10px] tabular-nums text-muted-foreground">
                    {formatAmPmTime(booking.startsAt)} ({booking.durationMinutes}
                    min)
                  </p>
                </button>
              ))
            )}
          </div>
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
          onStaffSelect={onStaffSelect}
          onSlotSelect={onSlotSelect}
          onBookingSelect={onBookingSelect}
        />
      ))}

      <p className="px-1 text-center text-[10px] text-muted-foreground">
        Dots show bookings on the shift bar · tap a dot for details · tap the
        line to add
      </p>
    </div>
  );
}
