"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, DoorOpen } from "lucide-react";

import { AppButton } from "@/components/common";
import {
  canCheckInToBooking,
  getActiveCheckedInBooking,
  isBookingCheckedIn,
} from "@/features/booking/lib/booking-check-in";
import {
  formatAmPmTime,
  formatBookingSummary,
  formatScheduleDate,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import { BookingCheckoutButton } from "@/features/booking/components/schedule/booking-checkout-button";
import { useTenant } from "@/features/tenants";
import type { AdminBooking } from "@/features/booking/types/admin-booking";
import { cn } from "@/lib/utils";

import { StaffCheckInSheet } from "./staff-check-in-sheet";

interface StaffScheduleResponse {
  date: string;
  staff: { id: string; name: string };
  shift: {
    label: string;
    shiftStartsAt: string;
    shiftEndsAt: string;
    isOvernight: boolean;
  } | null;
  bookings: AdminBooking[];
}

function addDays(date: string, delta: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12));
  next.setUTCDate(next.getUTCDate() + delta);
  return next.toISOString().slice(0, 10);
}

export function StaffHome() {
  const tenant = useTenant();
  const timeZone = tenant.settings.timezone;
  const [date, setDate] = useState(() => todayDateInZone(timeZone));
  const [data, setData] = useState<StaffScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInBooking, setCheckInBooking] = useState<AdminBooking | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/schedule?date=${date}`);
      const json = (await response.json()) as StaffScheduleResponse & {
        error?: string;
      };
      if (response.ok) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const bookings = useMemo(() => data?.bookings ?? [], [data?.bookings]);
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

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <AppButton
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setDate((current) => addDays(current, -1))}
          >
            <ChevronLeft className="size-4" />
          </AppButton>
          <div className="min-w-0 text-center">
            <p className="text-lg font-semibold tracking-tight">
              {formatScheduleDate(`${date}T12:00:00`)}
            </p>
            {data?.shift ? (
              <p className="text-sm text-muted-foreground">{data.shift.label}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No shift scheduled</p>
            )}
          </div>
          <AppButton
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setDate((current) => addDays(current, 1))}
          >
            <ChevronRight className="size-4" />
          </AppButton>
        </div>
      </section>

      {activeBooking ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            In room now
          </p>
          <p className="mt-1 text-sm">
            {activeBooking.roomName ?? "Room"} ·{" "}
            {formatBookingSummary(activeBooking)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activeBooking.customerName ?? "Walk-in"}
          </p>
          <div className="mt-3">
            <BookingCheckoutButton
              bookingId={activeBooking.id}
              roomName={activeBooking.roomName}
              size="default"
              className="h-11 w-full rounded-xl"
              onCheckedOut={() => void load()}
            />
          </div>
        </section>
      ) : nextCheckIn ? (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold">Next booking</p>
          <p className="mt-1 text-sm">
            {nextCheckIn.roomName ?? "Room TBD"} ·{" "}
            {formatAmPmTime(nextCheckIn.startsAt)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {nextCheckIn.customerName ?? "Walk-in"}
          </p>
          <div className="mt-3">
            <AppButton
              type="button"
              className="h-11 w-full rounded-xl"
              onClick={() => setCheckInBooking(nextCheckIn)}
            >
              <DoorOpen className="size-4" />
              Enter room
            </AppButton>
          </div>
        </section>
      ) : null}

      <section>
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          My bookings
        </p>
        {loading ? (
          <p className="rounded-2xl border border-border/40 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : bookings.length === 0 ? (
          <p className="rounded-2xl border border-border/40 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No bookings for this day.
          </p>
        ) : (
          <ul className="space-y-2">
            {bookings.map((booking) => {
              const checkedIn = isBookingCheckedIn(booking);
              const canEnter = canCheckInToBooking(booking) && !activeBooking;

              return (
                <li
                  key={booking.id}
                  className={cn(
                    "rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-soft",
                    checkedIn && "border-emerald-500/30",
                  )}
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
                      {checkedIn ? (
                        <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Checked in
                        </p>
                      ) : null}
                    </div>
                    {canEnter ? (
                      <AppButton
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-xl"
                        onClick={() => setCheckInBooking(booking)}
                      >
                        Enter
                      </AppButton>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <StaffCheckInSheet
        booking={checkInBooking}
        open={checkInBooking !== null}
        onOpenChange={(open) => !open && setCheckInBooking(null)}
        onCheckedIn={() => void load()}
      />
    </div>
  );
}
