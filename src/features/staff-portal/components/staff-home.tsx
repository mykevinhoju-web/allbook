"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  formatAmPmTime,
  formatBookingSummary,
  formatScheduleDate,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import { filterActiveRoomBookings } from "@/features/booking/lib/room-occupancy";
import type {
  AdminBooking,
  AdminRoom,
} from "@/features/booking/types/admin-booking";
import { useTenant } from "@/features/tenants";
import { useNowTick } from "@/hooks/use-now-tick";
import { cn } from "@/lib/utils";

import { fetchStaffApi } from "../lib/staff-api-client";
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
  rooms: AdminRoom[];
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
  const currency = tenant.settings.currency ?? "AUD";
  const now = useNowTick(60_000);
  const today = todayDateInZone(timeZone, now);
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
      const response = await fetchStaffApi(`/api/staff/schedule?date=${date}`);
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
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (date < today) {
      setDate(today);
    }
  }, [date, today]);

  const bookings = useMemo(
    () => filterActiveRoomBookings(data?.bookings ?? [], now),
    [data?.bookings, now],
  );
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

  const openDetail = (booking: AdminBooking) => {
    setDetailBooking(booking);
  };

  const openCheckIn = (booking: AdminBooking) => {
    setCheckInBooking(booking);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <AppButton
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            disabled={date <= today}
            onClick={() =>
              setDate((current) => {
                const previous = addDays(current, -1);
                return previous < today ? today : previous;
              })
            }
          >
            <ChevronLeft className="size-4" />
          </AppButton>
          <div className="min-w-0 text-center">
            <p className="text-lg font-semibold tracking-tight">
              {formatScheduleDate(`${date}T12:00:00`)}
            </p>
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

        <div
          className={cn(
            "mt-3 rounded-xl px-3 py-3 text-center",
            data?.shift
              ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              : "bg-muted/60 text-muted-foreground",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
            {date === today
              ? "Today's schedule"
              : "Shift"}
          </p>
          {loading && !data ? (
            <p className="mt-1 text-sm">Loading…</p>
          ) : data?.shift ? (
            <p className="mt-1 text-base font-semibold tracking-tight">
              {data.shift.label}
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium">Off today</p>
          )}
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
        ) : bookings.length === 0 ? (
          <p className="rounded-2xl border border-border/40 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No bookings for this day.
          </p>
        ) : (
          <ul className="space-y-2">
            {bookings.map((booking) => {
              const checkedIn = isBookingCheckedIn(booking);
              const canEnter =
                canCheckInToBooking(booking) && !activeBooking;

              return (
                <li key={booking.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-2xl border border-border/60 bg-card px-4 py-3 text-left shadow-soft transition hover:border-primary/30 hover:bg-card/80",
                      checkedIn && "border-emerald-500/30",
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

      <BookingDetailSheet
        booking={detailBooking}
        open={detailBooking !== null}
        onOpenChange={(open) => !open && setDetailBooking(null)}
        currency={currency}
        rooms={rooms}
        dayBookings={bookings}
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
