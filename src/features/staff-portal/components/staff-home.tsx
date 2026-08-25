"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, DoorOpen } from "lucide-react";

import { AppButton } from "@/components/common";
import { BookingDetailSheet } from "@/features/booking/components/schedule/booking-detail-sheet";
import { BookingCheckoutButton } from "@/features/booking/components/schedule/booking-checkout-button";
import {
  canCheckInToBooking,
  getActiveCheckedInBooking,
  isBookingCheckedIn,
} from "@/features/booking/lib/booking-check-in";
import {
  addDaysToDateInput,
  formatAmPmTime,
  formatBookingSummary,
  formatScheduleDate,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import type {
  AdminBooking,
  AdminRoom,
} from "@/features/booking/types/admin-booking";
import { useTenant } from "@/features/tenants";
import { useNowTick } from "@/hooks/use-now-tick";
import { cn } from "@/lib/utils";

import { fetchStaffApi } from "../lib/staff-api-client";
import { StaffCheckInSheet } from "./staff-check-in-sheet";
import { StaffPortalTabs } from "./staff-portal-tabs";

type ScheduleView = "day" | "month";

interface ScheduleDay {
  date: string;
  working: boolean;
  shiftLabel: string | null;
  bookingCount: number;
}

interface StaffScheduleResponse {
  date: string | null;
  from: string;
  to: string;
  staff: { id: string; name: string };
  shift: {
    label: string;
    shiftStartsAt: string;
    shiftEndsAt: string;
    isOvernight: boolean;
  } | null;
  days?: ScheduleDay[];
  bookings: AdminBooking[];
  rooms: AdminRoom[];
}

function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function monthEnd(date: string): string {
  const [y, m] = date.split("-").map(Number);
  const last = new Date(Date.UTC(y ?? 2026, m ?? 1, 0)).getUTCDate();
  return `${date.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

function shiftMonth(date: string, delta: number): string {
  const [y, m] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1 + delta, 1));
  return next.toISOString().slice(0, 10);
}

function formatMonthLabel(date: string): string {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, 1)).toLocaleDateString(
    "en-AU",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
}

function weekdayIndex(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}

export function StaffHome() {
  const tenant = useTenant();
  const timeZone = tenant.settings.timezone;
  const currency = tenant.settings.currency ?? "AUD";
  const now = useNowTick(60_000);
  const today = todayDateInZone(timeZone, now);
  const searchParams = useSearchParams();
  const [view, setView] = useState<ScheduleView>(
    searchParams.get("view") === "month" ? "month" : "day",
  );
  const [date, setDate] = useState(() => todayDateInZone(timeZone));
  const [data, setData] = useState<StaffScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInBooking, setCheckInBooking] = useState<AdminBooking | null>(
    null,
  );
  const [detailBooking, setDetailBooking] = useState<AdminBooking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query =
        view === "month"
          ? `from=${monthStart(date)}&to=${monthEnd(date)}`
          : `date=${date}`;
      const response = await fetchStaffApi(`/api/staff/schedule?${query}`);
      const json = (await response.json()) as StaffScheduleResponse & {
        error?: string;
      };
      if (response.ok) {
        setData(json);
        setDetailBooking((current) => {
          if (!current) return null;
          return json.bookings.find((booking) => booking.id === current.id) ?? null;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [date, view]);

  useEffect(() => {
    void load();
  }, [load]);

  const bookings = data?.bookings ?? [];
  const dayBookings = view === "day" ? bookings : [];

  const rooms = useMemo(
    () =>
      (data?.rooms ?? [])
        .filter((room) => room.isActive !== false)
        .map((room) => ({ id: room.id, name: room.name })),
    [data?.rooms],
  );
  const activeBooking = useMemo(
    () => getActiveCheckedInBooking(bookings),
    [bookings],
  );

  const nextCheckIn = useMemo(
    () =>
      bookings.find(
        (booking) =>
          !isBookingCheckedIn(booking) &&
          canCheckInToBooking(booking) &&
          booking.id !== activeBooking?.id,
      ) ?? null,
    [bookings, activeBooking],
  );

  const statusCounts = useMemo(() => {
    let upcoming = 0;
    let inRoom = 0;
    let done = 0;
    for (const booking of dayBookings) {
      if (Boolean(booking.checkedOutAt) || booking.status === "completed") {
        done += 1;
      } else if (isBookingCheckedIn(booking)) {
        inRoom += 1;
      } else {
        upcoming += 1;
      }
    }
    return { upcoming, inRoom, done, total: dayBookings.length };
  }, [dayBookings]);

  const monthDays = data?.days ?? [];
  const leadingBlanks =
    monthDays[0] ? (weekdayIndex(monthDays[0].date) + 6) % 7 : 0;

  const openDetail = (booking: AdminBooking) => {
    setDetailBooking(booking);
  };

  const openCheckIn = (booking: AdminBooking) => {
    setCheckInBooking(booking);
  };

  const openDay = (nextDate: string) => {
    setDate(nextDate);
    setView("day");
  };

  useEffect(() => {
    setView(searchParams.get("view") === "month" ? "month" : "day");
  }, [searchParams]);

  return (
    <div className="space-y-5">
      <StaffPortalTabs active={view === "month" ? "month" : "day"} />

      {view === "day" ? (
        <>
          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setDate((current) => addDaysToDateInput(current, -1))}
              >
                <ChevronLeft className="size-4" />
              </AppButton>
              <button
                type="button"
                className="min-w-0 text-center"
                onClick={() => setDate(today)}
              >
                <p className="text-lg font-semibold tracking-tight">
                  {formatScheduleDate(`${date}T12:00:00`)}
                </p>
                {date === today ? (
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Today
                  </p>
                ) : null}
              </button>
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setDate((current) => addDaysToDateInput(current, 1))}
              >
                <ChevronRight className="size-4" />
              </AppButton>
            </div>

            <div
              className={cn(
                "mt-3 rounded-xl px-3 py-3 text-center",
                data?.shift
                  ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                  : "bg-muted/60 text-muted-foreground",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                {date === today ? "Today's schedule" : "Shift"}
              </p>
              {loading && !data ? (
                <p className="mt-1 text-sm">Loading…</p>
              ) : data?.shift ? (
                <p className="mt-1 text-base font-semibold tracking-tight">
                  {data.shift.label}
                </p>
              ) : (
                <p className="mt-1 text-sm font-medium">Off this day</p>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted/50 px-2 py-2">
                <p className="text-lg font-semibold tabular-nums">
                  {statusCounts.upcoming}
                </p>
                <p className="text-[11px] text-muted-foreground">Upcoming</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 px-2 py-2">
                <p className="text-lg font-semibold tabular-nums">
                  {statusCounts.inRoom}
                </p>
                <p className="text-[11px] text-muted-foreground">In room</p>
              </div>
              <div className="rounded-xl bg-muted/50 px-2 py-2">
                <p className="text-lg font-semibold tabular-nums">
                  {statusCounts.done}
                </p>
                <p className="text-[11px] text-muted-foreground">Done</p>
              </div>
            </div>
          </section>

          {activeBooking ? (
            <button
              type="button"
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left transition hover:bg-emerald-500/15"
              onClick={() => openDetail(activeBooking)}
            >
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                In room now
              </p>
              <p className="mt-1 text-sm">
                {activeBooking.roomName ?? "Room"} ·{" "}
                {formatBookingSummary(activeBooking)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeBooking.customerName ?? "Walk-in"}
                {activeBooking.customerPhone
                  ? ` · ${activeBooking.customerPhone}`
                  : ""}
              </p>
              <div className="mt-3" onClick={(event) => event.stopPropagation()}>
                <BookingCheckoutButton
                  bookingId={activeBooking.id}
                  roomName={activeBooking.roomName}
                  size="default"
                  className="h-11 w-full rounded-xl"
                  fetchApi={fetchStaffApi}
                  onCheckedOut={() => void load()}
                />
              </div>
            </button>
          ) : nextCheckIn ? (
            <button
              type="button"
              className="w-full rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left transition hover:bg-primary/10"
              onClick={() => openDetail(nextCheckIn)}
            >
              <p className="text-sm font-semibold">Next booking</p>
              <p className="mt-1 text-sm">
                {nextCheckIn.roomName ?? "Room TBD"} ·{" "}
                {formatAmPmTime(nextCheckIn.startsAt)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {nextCheckIn.customerName ?? "Walk-in"}
                {nextCheckIn.customerPhone ? ` · ${nextCheckIn.customerPhone}` : ""}
              </p>
              <div className="mt-3" onClick={(event) => event.stopPropagation()}>
                <AppButton
                  type="button"
                  className="h-11 w-full rounded-xl"
                  onClick={() => openCheckIn(nextCheckIn)}
                >
                  <DoorOpen className="size-4" />
                  Enter room
                </AppButton>
              </div>
            </button>
          ) : null}

          <section>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              My bookings
            </p>
            {loading ? (
              <p className="rounded-2xl border border-border/40 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : dayBookings.length === 0 ? (
              <p className="rounded-2xl border border-border/40 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                No bookings for this day.
              </p>
            ) : (
              <ul className="space-y-2">
                {dayBookings.map((booking) => {
                  const checkedIn = isBookingCheckedIn(booking);
                  const done =
                    Boolean(booking.checkedOutAt) ||
                    booking.status === "completed";
                  const canEnter =
                    canCheckInToBooking(booking) && !activeBooking;

                  return (
                    <li key={booking.id}>
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded-2xl border border-border/60 bg-card px-4 py-3 text-left shadow-soft transition hover:border-primary/30 hover:bg-card/80",
                          checkedIn && "border-emerald-500/30",
                          done && !checkedIn && "opacity-70",
                        )}
                        onClick={() => openDetail(booking)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {formatAmPmTime(booking.startsAt)} ·{" "}
                              {booking.roomName ?? "No room"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {booking.customerName ?? "Walk-in"}
                              {booking.customerPhone
                                ? ` · ${booking.customerPhone}`
                                : ""}
                            </p>
                            <p className="mt-1 text-xs font-medium">
                              {checkedIn
                                ? "In room"
                                : done
                                  ? "Done"
                                  : booking.paymentStatus === "unpaid" ||
                                      booking.paymentMethod === "pre"
                                    ? "Pre · unpaid"
                                    : "Upcoming"}
                            </p>
                          </div>
                          {canEnter ? (
                            <AppButton
                              type="button"
                              size="sm"
                              variant="outline"
                              className="shrink-0 rounded-xl"
                              onClick={(event) => {
                                event.stopPropagation();
                                openCheckIn(booking);
                              }}
                            >
                              Enter
                            </AppButton>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <AppButton
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setDate((current) => shiftMonth(current, -1))}
            >
              <ChevronLeft className="size-4" />
            </AppButton>
            <p className="text-lg font-semibold tracking-tight">
              {formatMonthLabel(date)}
            </p>
            <AppButton
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setDate((current) => shiftMonth(current, 1))}
            >
              <ChevronRight className="size-4" />
            </AppButton>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, index) => (
              <div key={`blank-${index}`} className="aspect-square" />
            ))}
            {loading && monthDays.length === 0
              ? Array.from({ length: 30 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="aspect-square rounded-xl bg-muted/50"
                  />
                ))
              : monthDays.map((day) => {
                  const selected = day.date === date;
                  const isToday = day.date === today;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => openDay(day.date)}
                      className={cn(
                        "aspect-square rounded-xl border px-1 py-1.5 text-left transition",
                        selected
                          ? "border-primary bg-primary/10"
                          : day.working
                            ? "border-border/60 bg-card"
                            : "border-transparent bg-muted/40 text-muted-foreground",
                        isToday && !selected && "ring-1 ring-primary/40",
                      )}
                    >
                      <p className="text-xs font-semibold">
                        {Number(day.date.slice(8))}
                      </p>
                      {day.bookingCount > 0 ? (
                        <p className="mt-1 text-[10px] font-semibold tabular-nums text-foreground">
                          {day.bookingCount}
                        </p>
                      ) : day.working ? (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          ·
                        </p>
                      ) : null}
                    </button>
                  );
                })}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Tap a day to see bookings. Numbers are booking counts.
          </p>
        </section>
      )}

      <BookingDetailSheet
        booking={detailBooking}
        open={detailBooking !== null}
        onOpenChange={(open) => !open && setDetailBooking(null)}
        currency={currency}
        dayBookings={dayBookings}
        fetchApi={fetchStaffApi}
        allowCancel={false}
        hideStaffField
        onEnterRoom={
          detailBooking && canCheckInToBooking(detailBooking) && !activeBooking
            ? () => openCheckIn(detailBooking)
            : undefined
        }
        onCheckedOut={() => void load()}
        onRoomChanged={(booking) => {
          setDetailBooking(booking);
          void load();
        }}
      />

      <StaffCheckInSheet
        booking={checkInBooking}
        open={checkInBooking !== null}
        onOpenChange={(open) => !open && setCheckInBooking(null)}
        onCheckedIn={() => void load()}
      />
    </div>
  );
}
