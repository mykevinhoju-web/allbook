"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";

import type { AdminBooking, AdminRoom } from "@/features/booking/types/admin-booking";
import { formatAmPmTime, todayDateInputValue } from "@/features/booking/lib/schedule-utils";

function formatRange(startsAt: string, endsAt: string) {
  return `${formatAmPmTime(startsAt)} – ${formatAmPmTime(endsAt)}`;
}

export function RoomsScheduleContent() {
  const [date, setDate] = useState(todayDateInputValue());
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsResponse, bookingsResponse] = await Promise.all([
        fetch("/api/admin/rooms"),
        fetch(`/api/admin/bookings?date=${date}`),
      ]);

      const roomsData = (await roomsResponse.json()) as {
        rooms?: AdminRoom[];
        error?: string;
      };
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
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    for (const booking of bookings) {
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
  }, [bookings]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Room schedule</h1>
          <p className="text-sm text-muted-foreground">
            See which staff is booked in each room for the selected day.{" "}
            <Link href="/admin/rooms" className="text-primary underline">
              Manage rooms
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 rounded-xl"
          />
          <AppButton type="button" className="rounded-xl" onClick={() => void load()}>
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
          return (
            <div
              key={room.id}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">{room.name}</p>
                <p className="text-xs text-muted-foreground">
                  {roomBookings.length} booking{roomBookings.length === 1 ? "" : "s"}
                </p>
              </div>

              {roomBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings.</p>
              ) : (
                <div className="space-y-2">
                  {roomBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-border/60 bg-background px-3 py-2"
                    >
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

