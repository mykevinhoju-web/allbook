"use client";

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
import { useTenant } from "@/features/tenants";
import type { StaffRecord } from "@/features/staff/types";

import { useBookingRealtime } from "../../lib/booking-schedule-realtime";
import {
  isWorkingToday,
  todayDateInputValue,
} from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";
import { StaffScheduleColumn } from "./staff-schedule-column";
import { StaffScheduleDetail } from "./staff-schedule-detail";

export function BookingScheduleContent() {
  const tenant = useTenant();
  const [date, setDate] = useState(todayDateInputValue());
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBooking, setNewBooking] = useState({
    staffId: "",
    startsAt: "",
    durationMinutes: "60",
    customerName: "",
  });

  const loadSchedule = useCallback(async () => {
    try {
      const [staffResponse, bookingsResponse] = await Promise.all([
        fetch("/api/admin/staff"),
        fetch(`/api/admin/bookings?date=${date}`),
      ]);

      const staffData = (await staffResponse.json()) as { staff?: StaffRecord[] };
      const bookingsData = (await bookingsResponse.json()) as {
        bookings?: AdminBooking[];
      };

      setStaff(staffData.staff ?? []);
      setBookings(bookingsData.bookings ?? []);
    } catch {
      toast.error("Could not load schedule");
    }
  }, [date]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  useBookingRealtime(tenant.id, loadSchedule);

  const workingStaff = useMemo(
    () =>
      staff.filter(
        (member) =>
          member.status === "active" && isWorkingToday(member.workingDays),
      ),
    [staff],
  );

  const selectedStaff = workingStaff.find(
    (member) => member.id === selectedStaffId,
  );

  const createBooking = async () => {
    if (!newBooking.staffId || !newBooking.startsAt) {
      toast.error("Staff and start time are required");
      return;
    }

    const response = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId: newBooking.staffId,
        startsAt: new Date(`${date}T${newBooking.startsAt}:00`).toISOString(),
        durationMinutes: Number(newBooking.durationMinutes),
        customerName: newBooking.customerName || undefined,
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

    toast.success("Booking created", {
      description: data.booking?.roomName
        ? `Assigned to ${data.booking.roomName}`
        : undefined,
    });

    setShowCreate(false);
    setNewBooking({
      staffId: "",
      startsAt: "",
      durationMinutes: "60",
      customerName: "",
    });
    void loadSchedule();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Live schedule for staff working today. Rooms are auto-assigned to the
            first available treatment room.
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
            onClick={() => setShowCreate(true)}
          >
            <Plus className="size-4" />
            Add booking
          </AppButton>
        </div>
      </div>

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
                staffId={member.id}
                name={member.name}
                photoUrl={member.photoUrl}
                bookings={bookings.filter(
                  (booking) => booking.staffId === member.id,
                )}
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
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Staff schedule</SheetTitle>
          </SheetHeader>
          {selectedStaff ? (
            <StaffScheduleDetail
              staffName={selectedStaff.name}
              date={date}
              bookings={bookings.filter(
                (booking) => booking.staffId === selectedStaff.id,
              )}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>New booking</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <label className="block space-y-2 text-sm">
              <span>Staff</span>
              <select
                className="h-10 w-full rounded-xl border border-border/60 bg-background px-3"
                value={newBooking.staffId}
                onChange={(event) =>
                  setNewBooking((current) => ({
                    ...current,
                    staffId: event.target.value,
                  }))
                }
              >
                <option value="">Select staff</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm">
              <span>Start time</span>
              <Input
                type="time"
                value={newBooking.startsAt}
                onChange={(event) =>
                  setNewBooking((current) => ({
                    ...current,
                    startsAt: event.target.value,
                  }))
                }
                className="rounded-xl"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span>Duration (minutes)</span>
              <select
                className="h-10 w-full rounded-xl border border-border/60 bg-background px-3"
                value={newBooking.durationMinutes}
                onChange={(event) =>
                  setNewBooking((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
              >
                {["15", "20", "30", "45", "60", "90", "120"].map((value) => (
                  <option key={value} value={value}>
                    {value} minutes
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm">
              <span>Customer name (optional)</span>
              <Input
                value={newBooking.customerName}
                onChange={(event) =>
                  setNewBooking((current) => ({
                    ...current,
                    customerName: event.target.value,
                  }))
                }
                className="rounded-xl"
              />
            </label>

            <AppButton
              type="button"
              className="w-full rounded-xl"
              onClick={() => void createBooking()}
            >
              Create booking
            </AppButton>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
