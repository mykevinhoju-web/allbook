"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { BookingCheckoutButton } from "@/features/booking/components/schedule/booking-checkout-button";
import type { AdminBooking, AdminRoom } from "@/features/booking/types/admin-booking";
import type { StaffRecord } from "@/features/staff/types";
import {
  formatAmPmTime,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import { computeScheduleGridWindow } from "@/features/booking/lib/schedule-grid-utils";
import {
  filterActiveRoomBookings,
  getCurrentRoomBooking,
  isBookingOccupyingRoom,
  isBookingUpcoming,
} from "@/features/booking/lib/room-occupancy";
import { useBookingRealtime } from "@/features/booking/lib/booking-schedule-realtime";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import { useTenant } from "@/features/tenants";
import { useNowTick } from "@/hooks/use-now-tick";
import { cn } from "@/lib/utils";

function formatRange(startsAt: string, endsAt: string) {
  return `${formatAmPmTime(startsAt)} – ${formatAmPmTime(endsAt)}`;
}

export function RoomsScheduleContent() {
  const tenant = useTenant();
  const now = useNowTick();
  const today = todayDateInZone(tenant.settings.timezone, now);
  const [date, setDate] = useState(() =>
    todayDateInZone(tenant.settings.timezone),
  );
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const timeZone = tenant.settings.timezone;
      const now = new Date();

      const [roomsResponse, staffResponse] = await Promise.all([
        fetchAdminApi("/api/admin/rooms"),
        fetchAdminApi("/api/admin/staff"),
      ]);

      const roomsData = (await roomsResponse.json()) as {
        rooms?: AdminRoom[];
        error?: string;
      };

      const staffData = (await staffResponse.json()) as { staff?: StaffRecord[] };
      const staffMembers = staffData.staff ?? [];
      const gridWindow = computeScheduleGridWindow(
        staffMembers,
        date,
        timeZone,
        now,
      );

      const bookingsUrl = gridWindow
        ? `/api/admin/bookings?from=${encodeURIComponent(
            new Date(gridWindow.startMs).toISOString(),
          )}&to=${encodeURIComponent(
            new Date(gridWindow.endMs).toISOString(),
          )}`
        : `/api/admin/bookings?date=${date}`;

      const bookingsResponse = await fetchAdminApi(bookingsUrl);
      const bookingsData = (await bookingsResponse.json()) as {
        bookings?: AdminBooking[];
        error?: string;
      };

      if (!roomsResponse.ok) {
        throw new Error(roomsData.error ?? "Failed to load rooms.");
      }
      if (!bookingsResponse.ok) {
        throw new Error(bookingsData.error ?? "Failed to load bookings.");
      }

      setRooms((roomsData.rooms ?? []).filter((room) => room.isActive));
      setBookings(bookingsData.bookings ?? []);
    } catch (error) {
      toast.error("Could not load room schedule", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [date, tenant.settings.timezone]);

  useEffect(() => {
    void load();
  }, [load]);

  useBookingRealtime(tenant.id, load);

  const activeBookings = useMemo(
    () => filterActiveRoomBookings(bookings, now),
    [bookings, now],
  );

  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    for (const booking of activeBookings) {
      if (!booking.roomId) continue;
      const list = map.get(booking.roomId) ?? [];
      list.push(booking);
      map.set(booking.roomId, list);
    }
    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort(
          (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
      );
    }
    return map;
  }, [activeBookings]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Room schedule</h1>
          <p className="text-sm text-muted-foreground">
            View-only room occupancy. Create bookings from{" "}
            <Link href="/admin/bookings" className="text-primary underline">
              Bookings
            </Link>
            .{" "}
            <Link href="/admin/rooms" className="text-primary underline">
              Manage rooms
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="date"
            value={date}
            min={today}
            onChange={(event) => {
              const next = event.target.value;
              setDate(next < today ? today : next);
            }}
            className="h-11 rounded-xl"
          />
          <AppButton
            type="button"
            className="h-11 rounded-xl"
            onClick={() => void load()}
          >
            Refresh
          </AppButton>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Loading schedule...
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const roomBookings = bookingsByRoom.get(room.id) ?? [];
          const currentBooking = getCurrentRoomBooking(roomBookings, now);
          const upcomingBookings = roomBookings.filter(
            (booking) =>
              !isBookingOccupyingRoom(booking, now) &&
              isBookingUpcoming(booking, now),
          );
          const isEmpty = !currentBooking && upcomingBookings.length === 0;

          return (
            <div
              key={room.id}
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-soft",
                currentBooking
                  ? "border-amber-500/40 ring-1 ring-amber-500/20"
                  : "border-border/60",
              )}
            >
              <div className="mb-3">
                <p className="font-semibold">{room.name}</p>
                <p
                  className={cn(
                    "text-xs font-medium",
                    currentBooking
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {currentBooking ? "In use now" : "Available"}
                </p>
              </div>

              {isEmpty ? (
                <p className="text-sm text-muted-foreground">
                  Empty — ready for the next booking.
                </p>
              ) : (
                <div className="space-y-2">
                  {currentBooking ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                      <p className="text-sm font-medium">
                        {formatRange(currentBooking.startsAt, currentBooking.endsAt)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {currentBooking.staffName} ·{" "}
                        {currentBooking.customerName ?? "Walk-in"}
                      </p>
                      <div className="mt-2">
                        <BookingCheckoutButton
                          bookingId={currentBooking.id}
                          roomName={room.name}
                          onCheckedOut={() => void load()}
                        />
                      </div>
                    </div>
                  ) : null}

                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-border/60 bg-background px-3 py-2"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Upcoming
                      </p>
                      <p className="text-sm font-medium">
                        {formatRange(booking.startsAt, booking.endsAt)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {booking.staffName} · {booking.customerName ?? "Walk-in"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
