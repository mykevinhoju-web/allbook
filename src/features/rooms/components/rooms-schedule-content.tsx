"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import {
  BookingFormSheet,
  defaultBookingFormValues,
  type BookingFormValues,
} from "@/features/booking/components/schedule/booking-form-sheet";
import type { AdminBooking, AdminRoom } from "@/features/booking/types/admin-booking";
import {
  buildStartsAtIso,
  formatAmPmTime,
  generateTimeSlotOptions,
  isValidServiceDuration,
  todayDateInputValue,
} from "@/features/booking/lib/schedule-utils";
import { useBookingAlerts } from "@/features/booking/context/booking-alert-provider";
import { formatPriceFromCents } from "@/features/services";
import type { ServiceOption } from "@/features/services";
import type { StaffRecord } from "@/features/staff/types";
import { useTenant } from "@/features/tenants";

function formatRange(startsAt: string, endsAt: string) {
  return `${formatAmPmTime(startsAt)} – ${formatAmPmTime(endsAt)}`;
}

export function RoomsScheduleContent() {
  const tenant = useTenant();
  const { alertsEnabled, notifyBooking } = useBookingAlerts();
  const [date, setDate] = useState(todayDateInputValue());
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<BookingFormValues>(defaultBookingFormValues);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsResponse, bookingsResponse, staffResponse, optionsResponse] =
        await Promise.all([
          fetch("/api/admin/rooms"),
          fetch(`/api/admin/bookings?date=${date}`),
          fetch("/api/admin/staff"),
          fetch("/api/admin/service-options"),
        ]);

      const roomsData = (await roomsResponse.json()) as {
        rooms?: AdminRoom[];
        error?: string;
      };
      const bookingsData = (await bookingsResponse.json()) as {
        bookings?: AdminBooking[];
        error?: string;
      };
      const staffData = (await staffResponse.json()) as {
        staff?: StaffRecord[];
      };
      const optionsData = (await optionsResponse.json()) as {
        options?: ServiceOption[];
      };

      if (!roomsResponse.ok) {
        throw new Error(roomsData.error ?? "Failed to load rooms.");
      }
      if (!bookingsResponse.ok) {
        throw new Error(bookingsData.error ?? "Failed to load bookings.");
      }

      setRooms((roomsData.rooms ?? []).filter((room) => room.isActive));
      setBookings(bookingsData.bookings ?? []);
      setStaff((staffData.staff ?? []).filter((member) => member.status === "active"));
      setServiceOptions(optionsData.options ?? []);
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

  const defaultDuration =
    serviceOptions[0]?.durationMinutes != null
      ? String(serviceOptions[0].durationMinutes)
      : "";

  const openCreateForm = (roomId: string) => {
    setForm({
      ...defaultBookingFormValues,
      roomId,
      durationMinutes: defaultDuration,
    });
    setShowCreate(true);
  };

  const createBooking = async () => {
    if (!form.staffId || !form.startsAt || !form.durationMinutes) {
      toast.error("Staff, start time, and service are required");
      return;
    }

    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error("Customer name and phone are required");
      return;
    }

    if (!form.roomId) {
      toast.error("Room is required");
      return;
    }

    setSubmitting(true);

    try {
      const durationMinutes = Number(form.durationMinutes);
      const allowed = serviceOptions.map((option) => option.durationMinutes);

      if (!isValidServiceDuration(durationMinutes, allowed)) {
        toast.error("Select a valid service duration");
        return;
      }

      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: form.staffId,
          startsAt: buildStartsAtIso(date, form.startsAt),
          durationMinutes,
          roomId: form.roomId,
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerPostcode: form.customerPostcode.trim() || undefined,
          customerEmail: form.customerEmail.trim() || undefined,
        }),
      });

      const data = (await response.json()) as {
        booking?: AdminBooking;
        error?: string;
      };

      if (!response.ok) {
        toast.error("Could not create booking", { description: data.error });
        return;
      }

      const priceLabel = data.booking?.priceCents
        ? formatPriceFromCents(
            data.booking.priceCents,
            tenant.settings.currency,
          )
        : null;

      toast.success("Booking created", {
        description: [priceLabel, data.booking?.roomName]
          .filter(Boolean)
          .join(" · "),
      });

      if (alertsEnabled && data.booking?.staffName) {
        notifyBooking(data.booking.staffName);
      }

      setShowCreate(false);
      setForm(defaultBookingFormValues);
      void load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Room schedule</h1>
          <p className="text-sm text-muted-foreground">
            Book empty rooms or see who is in each room.{" "}
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
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{room.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {roomBookings.length} booking
                    {roomBookings.length === 1 ? "" : "s"}
                  </p>
                </div>
                <AppButton
                  type="button"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => openCreateForm(room.id)}
                >
                  <CalendarPlus className="size-4" />
                  Book
                </AppButton>
              </div>

              {roomBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Empty — available to book.</p>
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

      <BookingFormSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Book room"
        date={date}
        staffOptions={staff.map((member) => ({
          id: member.id,
          name: member.name,
        }))}
        roomOptions={rooms.map((room) => ({
          id: room.id,
          name: room.name,
        }))}
        serviceOptions={serviceOptions}
        currency={tenant.settings.currency}
        timeOptions={generateTimeSlotOptions("00:00", "24:00")}
        values={form}
        onChange={setForm}
        onSubmit={() => void createBooking()}
        submitting={submitting}
      />
    </div>
  );
}
