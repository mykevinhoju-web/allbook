"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPriceFromCents } from "@/features/services";
import type { ServiceOption } from "@/features/services";
import { useTenant } from "@/features/tenants";
import type { StaffRecord } from "@/features/staff/types";

import { useBookingRealtime } from "../../lib/booking-schedule-realtime";
import { useBookingAlerts } from "../../context/booking-alert-provider";
import {
  buildStartsAtIso,
  generateTimeSlotOptions,
  isValidServiceDuration,
  isWorkingToday,
  todayDateInputValue,
} from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";
import {
  BookingFormSheet,
  defaultBookingFormValues,
  type BookingFormValues,
} from "./booking-form-sheet";
import { StaffScheduleColumn } from "./staff-schedule-column";
import { StaffScheduleDetail } from "./staff-schedule-detail";

export function BookingScheduleContent() {
  const tenant = useTenant();
  const { alertsEnabled, notifyBooking } = useBookingAlerts();
  const [date, setDate] = useState(todayDateInputValue());
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<BookingFormValues>(defaultBookingFormValues);

  const loadSchedule = useCallback(async () => {
    try {
      const [staffResponse, bookingsResponse, optionsResponse, roomsResponse] =
        await Promise.all([
        fetch("/api/admin/staff"),
        fetch(`/api/admin/bookings?date=${date}`),
        fetch("/api/admin/service-options"),
        fetch("/api/admin/rooms"),
      ]);

      const staffData = (await staffResponse.json()) as { staff?: StaffRecord[] };
      const bookingsData = (await bookingsResponse.json()) as {
        bookings?: AdminBooking[];
      };
      const optionsData = (await optionsResponse.json()) as {
        options?: ServiceOption[];
      };
      const roomsData = (await roomsResponse.json()) as {
        rooms?: { id: string; name: string; isActive?: boolean }[];
      };

      setStaff(staffData.staff ?? []);
      setBookings(bookingsData.bookings ?? []);
      setServiceOptions(optionsData.options ?? []);
      setRooms(
        (roomsData.rooms ?? [])
          .filter((room) => room.isActive !== false)
          .map((room) => ({ id: room.id, name: room.name })),
      );
    } catch {
      toast.error("Could not load schedule");
    }
  }, [date]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  useBookingRealtime(tenant.id, loadSchedule);

  const allowedDurations = useMemo(
    () => serviceOptions.map((option) => option.durationMinutes),
    [serviceOptions],
  );

  const defaultDuration =
    serviceOptions[0]?.durationMinutes != null
      ? String(serviceOptions[0].durationMinutes)
      : "";

  const workingStaff = useMemo(
    () =>
      staff.filter(
        (member) =>
          member.status === "active" && isWorkingToday(member.workingDays),
      ),
    [staff],
  );

  const selectedStaff =
    workingStaff.find((member) => member.id === selectedStaffId) ??
    staff.find((member) => member.id === selectedStaffId) ??
    null;

  const formTimeOptions = useMemo(() => {
    // Admin can create bookings at any time. Conflicts are validated on submit.
    return generateTimeSlotOptions("00:00", "24:00");
  }, []);

  const openCreateForm = (partial?: Partial<BookingFormValues>) => {
    setForm({
      ...defaultBookingFormValues,
      staffId: partial?.staffId ?? selectedStaffId ?? "",
      startsAt: partial?.startsAt ?? "",
      durationMinutes: partial?.durationMinutes ?? defaultDuration,
      roomId: partial?.roomId ?? "",
      customerName: "",
      customerPhone: "",
      customerPostcode: "",
      customerEmail: "",
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

    setSubmitting(true);

    try {
      const durationMinutes = Number(form.durationMinutes);

      if (!isValidServiceDuration(durationMinutes, allowedDurations)) {
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
          roomId: form.roomId || undefined,
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
      void loadSchedule();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Service prices are set under{" "}
            <Link href="/admin/services" className="text-primary underline">
              Services
            </Link>
            . Start times use 5-minute steps.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 rounded-xl"
          />
          <AppButton
            type="button"
            className="rounded-xl"
            onClick={() => openCreateForm()}
            disabled={serviceOptions.length === 0}
          >
            <Plus className="size-4" />
            Add booking
          </AppButton>
        </div>
      </div>

      {serviceOptions.length === 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          No service pricing yet.{" "}
          <Link href="/admin/services" className="font-medium text-primary underline">
            Add durations and prices
          </Link>{" "}
          before creating bookings.
        </div>
      ) : null}

      {workingStaff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
          <CalendarDays className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-medium">No staff scheduled for this day</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add staff or update working days to see the live booking board.
          </p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <div className="flex min-w-max gap-3">
            {workingStaff.map((member) => (
              <StaffScheduleColumn
                key={member.id}
                name={member.name}
                photoUrl={member.photoUrl}
                bookings={bookings.filter(
                  (booking) => booking.staffId === member.id,
                )}
                currency={tenant.settings.currency}
                selected={selectedStaffId === member.id}
                onSelect={() => setSelectedStaffId(member.id)}
              />
            ))}
          </div>
        </div>
      )}

      <Sheet
        open={selectedStaffId !== null}
        onOpenChange={(open) => !open && setSelectedStaffId(null)}
      >
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto rounded-t-[1.25rem] bg-muted/30 px-4 pb-8 pt-2"
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" />
          <SheetHeader className="sr-only">
            <SheetTitle>Staff schedule</SheetTitle>
          </SheetHeader>
          {selectedStaff ? (
            <StaffScheduleDetail
              staff={selectedStaff}
              date={date}
              bookings={bookings.filter(
                (booking) => booking.staffId === selectedStaff.id,
              )}
              serviceOptions={serviceOptions}
              currency={tenant.settings.currency}
              onAddBooking={(startsAt, durationMinutes) => {
                setSelectedStaffId(null);
                openCreateForm({
                  staffId: selectedStaff.id,
                  startsAt,
                  durationMinutes: String(durationMinutes),
                });
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <BookingFormSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        date={date}
        staffOptions={staff.map((member) => ({ id: member.id, name: member.name }))}
        roomOptions={rooms}
        serviceOptions={serviceOptions}
        currency={tenant.settings.currency}
        timeOptions={formTimeOptions}
        values={form}
        onChange={setForm}
        onSubmit={() => void createBooking()}
        submitting={submitting}
      />
    </div>
  );
}
