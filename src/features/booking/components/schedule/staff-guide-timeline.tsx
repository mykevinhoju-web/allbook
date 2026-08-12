"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { AppButton } from "@/components/common";
import { Input } from "@/components/ui/input";
import type { StaffRecord } from "@/features/staff/types";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import { parseShiftPlan } from "@/features/staff/utils/shift-plan";
import { cn } from "@/lib/utils";
import { useNowTick } from "@/hooks/use-now-tick";

import {
  formatAmPmTime,
  formatDurationLabel,
  todayDateInZone,
} from "../../lib/schedule-utils";
import { isOtherStaffGuestAttributes } from "../../lib/booking-other-staff";
import type { AdminBooking } from "../../types/admin-booking";
import { isBookingCheckedIn } from "../../lib/booking-check-in";

/** Tablet-first row height — easy tap targets. */
const ROW_HEIGHT = 84;
const LABEL_WIDTH = 112;
const HEADER_HEIGHT = 48;
/** Fixed guide windows: 00–06, 06–12, 12–18, 18–24. */
const BLOCK_HOURS = 6;
const BLOCKS_PER_DAY = 24 / BLOCK_HOURS;

const BOOKING_BLOCK_PALETTE = [
  {
    idle: "border-sky-500/50 bg-sky-200 text-sky-950",
    active: "border-sky-600 bg-sky-300 text-sky-950",
    muted: "text-sky-800/80",
  },
  {
    idle: "border-violet-500/50 bg-violet-200 text-violet-950",
    active: "border-violet-600 bg-violet-300 text-violet-950",
    muted: "text-violet-800/80",
  },
  {
    idle: "border-amber-500/50 bg-amber-200 text-amber-950",
    active: "border-amber-600 bg-amber-300 text-amber-950",
    muted: "text-amber-900/80",
  },
  {
    idle: "border-emerald-500/50 bg-emerald-200 text-emerald-950",
    active: "border-emerald-600 bg-emerald-300 text-emerald-950",
    muted: "text-emerald-800/80",
  },
  {
    idle: "border-rose-500/50 bg-rose-200 text-rose-950",
    active: "border-rose-600 bg-rose-300 text-rose-950",
    muted: "text-rose-800/80",
  },
  {
    idle: "border-teal-500/50 bg-teal-200 text-teal-950",
    active: "border-teal-600 bg-teal-300 text-teal-950",
    muted: "text-teal-800/80",
  },
] as const;

function bookingBlockTone(index: number) {
  return BOOKING_BLOCK_PALETTE[index % BOOKING_BLOCK_PALETTE.length]!;
}

const OUTCALL_BLOCK_TONE = {
  idle: "border-purple-600/70 bg-purple-300 text-purple-950",
  active: "border-purple-700 bg-purple-400 text-purple-950",
  muted: "text-purple-900/85",
} as const;

const OTHER_STAFF_BLOCK_TONE = {
  idle: "border-orange-600/70 bg-orange-300 text-orange-950",
  active: "border-orange-700 bg-orange-400 text-orange-950",
  muted: "text-orange-900/85",
} as const;

type DayBlock = 0 | 1 | 2 | 3;

function addDaysIso(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y!, m! - 1, d! + days));
  return next.toISOString().slice(0, 10);
}

function zonedHourMs(date: string, hour: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  let guess = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    hour,
    0,
    0,
  );
  for (let i = 0; i < 3; i++) {
    const parts = dtf.formatToParts(new Date(guess));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asLocal = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    const target = Date.UTC(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
      hour,
      0,
      0,
    );
    guess += target - asLocal;
  }
  return guess;
}

function zonedClockParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return {
    hour,
    minute,
    day: get("day"),
    month: get("month"),
  };
}

function formatGuideTick(ms: number, timeZone: string): string {
  const { hour, minute } = zonedClockParts(ms, timeZone);
  const h12 = hour % 12 || 12;
  if (minute !== 0) return `${h12}:${String(minute).padStart(2, "0")}`;
  return `${h12} ${hour < 12 ? "AM" : "PM"}`;
}

function formatDayChip(dateIso: string, timeZone: string): string {
  const ms = zonedHourMs(dateIso, 12, timeZone);
  const { day, month } = zonedClockParts(ms, timeZone);
  return `${day} ${month}`;
}

function hourToBlock(hour: number): DayBlock {
  return Math.min(BLOCKS_PER_DAY - 1, Math.floor(hour / BLOCK_HOURS)) as DayBlock;
}

function blockStartHour(block: DayBlock): number {
  return block * BLOCK_HOURS;
}

function blockRangeLabel(block: DayBlock): string {
  const start = blockStartHour(block);
  const end = start + BLOCK_HOURS;
  const fmt = (h: number) => {
    if (h === 0 || h === 24) return "12 AM";
    if (h === 12) return "12 PM";
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  };
  return `${fmt(start)}–${fmt(end === 24 ? 0 : end)}`;
}

function isAmBlock(block: DayBlock): boolean {
  return block < 2;
}

function ticks(startMs: number, endMs: number, stepMin = 30): number[] {
  const step = stepMin * 60_000;
  const first = Math.ceil(startMs / step) * step;
  const out: number[] = [];
  for (let t = first; t < endMs; t += step) out.push(t);
  return out;
}

export interface StaffGuideTimelineProps {
  date: string;
  onDateChange: (date: string) => void;
  /** Optional min date for the picker (e.g. today). */
  minDate?: string;
  timeZone: string;
  staff: StaffRecord[];
  bookings: AdminBooking[];
  loading?: boolean;
  selectedBookingId?: string | null;
  onBookingSelect: (booking: AdminBooking) => void;
  onCreateBooking?: () => void;
  createDisabled?: boolean;
  /** Banner above the schedule (e.g. missing service prices). */
  banner?: React.ReactNode;
}

export function StaffGuideTimeline({
  date,
  onDateChange,
  minDate,
  timeZone,
  staff,
  bookings,
  loading = false,
  selectedBookingId = null,
  onBookingSelect,
  onCreateBooking,
  createDisabled,
  banner,
}: StaffGuideTimelineProps) {
  const now = useNowTick(30_000);
  const [block, setBlock] = useState<DayBlock>(0);
  const didInitView = useRef(false);
  const pendingEndRef = useRef(false);
  const lastDateRef = useRef(date);

  const viewStartMs = zonedHourMs(date, blockStartHour(block), timeZone);
  const viewportMs = BLOCK_HOURS * 60 * 60_000;
  const viewEndMs = viewStartMs + viewportMs;
  const timeMarks = useMemo(
    () => ticks(viewStartMs, viewEndMs, 30),
    [viewStartMs, viewEndMs],
  );

  const pct = (ms: number) => ((ms - viewStartMs) / viewportMs) * 100;

  const amWindow = isAmBlock(block);
  const nearDayEnd = block === BLOCKS_PER_DAY - 1;
  const atDayStart = block === 0;

  // When date changes externally, re-init the visible block.
  useEffect(() => {
    if (lastDateRef.current !== date) {
      lastDateRef.current = date;
      didInitView.current = false;
    }
  }, [date]);

  useEffect(() => {
    if (loading || didInitView.current || pendingEndRef.current) return;
    const today = todayDateInZone(timeZone, now);
    if (date === today) {
      const hour = zonedClockParts(now.getTime(), timeZone).hour;
      setBlock(hourToBlock(hour));
    } else {
      setBlock(0);
    }
    didInitView.current = true;
  }, [loading, date, timeZone, now]);

  const displayStaff = useMemo(() => {
    const active = staff
      .filter((member) => member.status === "active")
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    const bookedTodayIds = new Set(
      bookings
        .filter((booking) => booking.status !== "cancelled")
        .map((booking) => booking.staffId),
    );

    const working = active.filter((member) =>
      isStaffWorkingOnDate(
        member.status,
        parseDaySchedule(member.attributes.daySchedule),
        date,
        parseShiftPlan(member.attributes.shiftPlan),
        timeZone,
      ),
    );

    const base = working.length > 0 ? working : active;
    const baseIds = new Set(base.map((member) => member.id));

    // Room joins can add bookings for staff not marked working today — still show their row.
    const joinedOnly = active.filter(
      (member) => bookedTodayIds.has(member.id) && !baseIds.has(member.id),
    );

    return [...base, ...joinedOnly];
  }, [staff, date, timeZone, bookings]);

  const bookingsByStaff = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;
      const list = map.get(booking.staffId) ?? [];
      list.push(booking);
      map.set(booking.staffId, list);
    }
    return map;
  }, [bookings]);

  const goPrev = () => {
    if (atDayStart) {
      pendingEndRef.current = true;
      onDateChange(addDaysIso(date, -1));
      didInitView.current = false;
      return;
    }
    setBlock((b) => (b - 1) as DayBlock);
  };

  const goNextOrNextDay = () => {
    if (nearDayEnd) {
      pendingEndRef.current = false;
      onDateChange(addDaysIso(date, 1));
      setBlock(0);
      didInitView.current = false;
      return;
    }
    setBlock((b) => (b + 1) as DayBlock);
  };

  useEffect(() => {
    if (loading || !pendingEndRef.current) return;
    pendingEndRef.current = false;
    setBlock((BLOCKS_PER_DAY - 1) as DayBlock);
    didInitView.current = true;
  }, [loading, date]);

  const jumpToNow = () => {
    const today = todayDateInZone(timeZone, now);
    if (date !== today) {
      onDateChange(today);
      didInitView.current = false;
      return;
    }
    setBlock(hourToBlock(zonedClockParts(now.getTime(), timeZone).hour));
  };

  const nowPct =
    now.getTime() >= viewStartMs && now.getTime() <= viewEndMs
      ? pct(now.getTime())
      : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:gap-4 md:p-5 lg:p-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Staff schedule
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatDayChip(date, timeZone)} · 6-hour blocks · tablet view
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={jumpToNow}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Now
          </button>
          <Input
            type="date"
            value={date}
            min={minDate}
            onChange={(event) => {
              didInitView.current = false;
              onDateChange(event.target.value);
            }}
            className="h-11 w-[10.5rem] rounded-xl text-sm"
          />
          {onCreateBooking ? (
            <AppButton
              type="button"
              className="h-11 rounded-xl px-4"
              onClick={onCreateBooking}
              disabled={createDisabled}
            >
              <Plus className="size-4" />
              Book
            </AppButton>
          ) : null}
        </div>
      </div>

      {banner}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading schedule…</p>
        ) : displayStaff.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No staff scheduled for this day.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b border-border/70 px-2 py-2.5 md:px-3">
              <div
                className="hidden shrink-0 md:block"
                style={{ width: LABEL_WIDTH }}
              />
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white hover:bg-teal-800 active:scale-[0.98]"
                aria-label={atDayStart ? "Previous day" : "Earlier"}
              >
                <ChevronLeft className="size-6" />
              </button>
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center rounded-xl px-3 py-2.5 text-center text-sm font-semibold tabular-nums md:text-base",
                  amWindow
                    ? "bg-sky-500/15 text-sky-950"
                    : "bg-amber-500/15 text-amber-950",
                )}
              >
                <span className="truncate">
                  {amWindow ? "AM" : "PM"} · {blockRangeLabel(block)} ·{" "}
                  {formatDayChip(date, timeZone)}
                </span>
              </div>
              <button
                type="button"
                onClick={goNextOrNextDay}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-xl bg-teal-700 px-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-teal-800 active:scale-[0.98]",
                  nearDayEnd ? "min-w-[7.25rem]" : "w-11",
                )}
                aria-label={nearDayEnd ? "Next day" : "Later"}
              >
                {nearDayEnd ? (
                  <>
                    Next Day
                    <ChevronRight className="size-5" />
                  </>
                ) : (
                  <ChevronRight className="size-6" />
                )}
              </button>
            </div>

            <div
              className="relative flex shrink-0 items-stretch border-b border-border/70"
              style={{ height: HEADER_HEIGHT }}
            >
              <div
                className="flex shrink-0 items-end border-r border-border/70 bg-card px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                style={{ width: LABEL_WIDTH }}
              >
                Staff
              </div>
              <div
                className={cn(
                  "relative min-w-0 flex-1",
                  amWindow ? "bg-sky-500/10" : "bg-amber-500/10",
                )}
              >
                {timeMarks.map((mark) => {
                  const { minute } = zonedClockParts(mark, timeZone);
                  return (
                    <div
                      key={mark}
                      className="absolute inset-y-0 border-l border-border/30"
                      style={{ left: `${pct(mark)}%` }}
                    >
                      <span
                        className={cn(
                          "absolute bottom-1 left-1 whitespace-nowrap text-[11px] tabular-nums md:text-xs",
                          minute === 0
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatGuideTick(mark, timeZone)}
                      </span>
                    </div>
                  );
                })}
                {nowPct != null ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-sky-500"
                    style={{ left: `${nowPct}%` }}
                  >
                    <span className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {formatAmPmTime(now.toISOString())}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {displayStaff.map((member) => {
                const rowBookings = bookingsByStaff.get(member.id) ?? [];
                return (
                  <div
                    key={member.id}
                    className="flex border-b border-border/50 last:border-b-0"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className="flex shrink-0 flex-col justify-center border-r border-border/70 bg-card px-2.5"
                      style={{ width: LABEL_WIDTH }}
                    >
                      <p className="truncate text-sm font-semibold text-foreground md:text-base">
                        {member.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground md:text-xs">
                        {isOtherStaffGuestAttributes(member.attributes)
                          ? "Other Staff"
                          : `${rowBookings.length} booking${rowBookings.length === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <div className="relative min-w-0 flex-1 bg-muted/15">
                      {timeMarks.map((mark) => {
                        const { minute } = zonedClockParts(mark, timeZone);
                        return (
                          <div
                            key={mark}
                            className={cn(
                              "absolute inset-y-0 border-l",
                              minute === 0
                                ? "border-border/35"
                                : "border-border/20",
                            )}
                            style={{ left: `${pct(mark)}%` }}
                          />
                        );
                      })}
                      {nowPct != null ? (
                        <div
                          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-sky-500"
                          style={{ left: `${nowPct}%` }}
                        />
                      ) : null}
                      {rowBookings.map((booking, bookingIndex) => {
                        const bStart = new Date(booking.startsAt).getTime();
                        const bEnd = new Date(booking.endsAt).getTime();
                        if (bEnd <= viewStartMs || bStart >= viewEndMs) {
                          return null;
                        }
                        const leftPct = pct(Math.max(bStart, viewStartMs));
                        const widthPct = Math.max(
                          5,
                          ((Math.min(bEnd, viewEndMs) -
                            Math.max(bStart, viewStartMs)) /
                            viewportMs) *
                            100,
                        );
                        const active = isBookingCheckedIn(booking);
                        const done =
                          Boolean(booking.checkedOutAt) ||
                          booking.status === "completed";
                        const selected = selectedBookingId === booking.id;
                        const tone = booking.outCall
                          ? OUTCALL_BLOCK_TONE
                          : booking.otherStaff
                            ? OTHER_STAFF_BLOCK_TONE
                            : bookingBlockTone(bookingIndex);
                        return (
                          <button
                            key={booking.id}
                            type="button"
                            onClick={() => onBookingSelect(booking)}
                            className={cn(
                              "absolute inset-y-0 z-[1] flex flex-col overflow-hidden rounded-none border border-y-0 border-l px-2 py-1.5 text-left transition hover:brightness-[0.97] active:brightness-[0.94]",
                              "border-r-2",
                              active ? tone.active : tone.idle,
                              done && !active && "opacity-70",
                              selected && "z-[2] ring-2 ring-inset ring-primary",
                            )}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                          >
                            <p className="truncate text-sm font-semibold leading-tight md:text-[15px]">
                              {booking.customerName?.trim() || "Guest"}
                              {done && !active ? " · Done" : ""}
                            </p>
                            <p
                              className={cn(
                                "truncate text-[11px] leading-tight md:text-xs",
                                tone.muted,
                              )}
                            >
                              {formatAmPmTime(booking.startsAt)}~
                              {formatAmPmTime(booking.endsAt)} ·{" "}
                              {formatDurationLabel(booking.durationMinutes)}
                              {!booking.outCall && booking.roomName
                                ? ` · ${booking.roomName}`
                                : ""}
                            </p>
                            {booking.outCall || booking.otherStaff ? (
                              <p
                                className={cn(
                                  "mt-auto truncate text-[10px] font-medium leading-none",
                                  tone.muted,
                                )}
                              >
                                {booking.outCall && booking.otherStaff
                                  ? "out call · Other Staff"
                                  : booking.outCall
                                    ? "out call"
                                    : "Other Staff"}
                              </p>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <p className="shrink-0 pb-1 text-center text-xs text-muted-foreground md:text-sm">
        Swipe blocks with Earlier / Later · tap a booking for details
      </p>
    </div>
  );
}
