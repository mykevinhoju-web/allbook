"use client";

import { useEffect, useMemo, useState } from "react";

import { AppAvatar } from "@/components/common";
import { cn } from "@/lib/utils";
import {
  formatPriceFromCents,
  type ServiceOption,
} from "@/features/services";
import { useTenant } from "@/features/tenants";
import type { StaffRecord } from "@/features/staff/types";

import { useAdminAvailabilitySlots } from "../../hooks/use-admin-availability-slots";
import {
  formatAmPmTime,
  formatBookingSummary,
  formatDurationLabel,
  formatScheduleDate,
  resolveStaffShiftForDate,
} from "../../lib/schedule-utils";
import { getShiftWindowFromAttributes } from "@/features/staff/utils/attributes";
import { parseShiftPlan } from "@/features/staff/utils/shift-plan";
import {
  getCurrentRoomBooking,
  isBookingOccupyingRoom,
} from "../../lib/room-occupancy";
import type { AdminBooking } from "../../types/admin-booking";
import { BookingCheckoutButton } from "./booking-checkout-button";
import { BookingCompactTimePicker } from "./booking-compact-time-picker";
import { ShiftTimelineBar } from "./shift-timeline-bar";

interface StaffScheduleDetailProps {
  staff: StaffRecord;
  date: string;
  bookings: AdminBooking[];
  serviceOptions: ServiceOption[];
  currency?: string;
  currentStaffId?: string | null;
  onAddBooking: (startsAt: string, durationMinutes: number) => void;
  onCheckedOut?: () => void;
}

function IosSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export function StaffScheduleDetail({
  staff,
  date,
  bookings,
  serviceOptions,
  currency = "AUD",
  currentStaffId = null,
  onAddBooking,
  onCheckedOut,
}: StaffScheduleDetailProps) {
  const tenant = useTenant();
  const [durationMinutes, setDurationMinutes] = useState(
    serviceOptions[0]?.durationMinutes ?? 30,
  );

  useEffect(() => {
    if (serviceOptions[0]?.durationMinutes) {
      setDurationMinutes(serviceOptions[0].durationMinutes);
    }
  }, [serviceOptions]);

  const { timeSlotOptions, timeSlotsLoading, timeSlotsHint } =
    useAdminAvailabilitySlots({
      staffId: staff.id,
      durationMinutes: String(durationMinutes),
      date,
      timeZone: tenant.settings.timezone,
    });

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [bookings],
  );

  const activeRoomBooking = useMemo(
    () => getCurrentRoomBooking(bookings.filter((booking) => booking.roomId)),
    [bookings],
  );

  const shiftWindow = useMemo(() => {
    const configured = getShiftWindowFromAttributes(staff.attributes);
    const shiftPlan = parseShiftPlan(staff.attributes.shiftPlan);

    return resolveStaffShiftForDate(
      date,
      tenant.settings.timezone,
      configured,
      staff.workingHoursStart,
      staff.workingHoursEnd,
      undefined,
      shiftPlan,
    );
  }, [staff, date, tenant.settings.timezone]);

  const canCheckOut =
    Boolean(activeRoomBooking) &&
    staff.id === currentStaffId &&
    activeRoomBooking?.staffId === staff.id;

  return (
    <div className="space-y-6 pb-6">
      {canCheckOut && activeRoomBooking ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold">You are in a room</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeRoomBooking.roomName ?? "Room"} · until{" "}
            {formatAmPmTime(activeRoomBooking.endsAt)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap check out when you leave so the room is free for the next
            booking.
          </p>
          <div className="mt-3">
            <BookingCheckoutButton
              bookingId={activeRoomBooking.id}
              roomName={activeRoomBooking.roomName}
              size="default"
              className="h-11 w-full rounded-xl"
              onCheckedOut={onCheckedOut}
            />
          </div>
        </section>
      ) : null}
      <div className="flex items-center gap-3">
        <AppAvatar
          src={staff.photoUrl ?? staff.photos[0]?.url}
          alt={staff.name}
          size="lg"
        />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight">
            {staff.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatScheduleDate(`${date}T12:00:00`)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {staff.workingHoursStart} – {staff.workingHoursEnd}
          </p>
        </div>
      </div>

      <section>
        <IosSectionLabel>Service</IosSectionLabel>
        <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-muted/60 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {serviceOptions.map((option) => {
            const selected = durationMinutes === option.durationMinutes;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setDurationMinutes(option.durationMinutes)}
                className={cn(
                  "shrink-0 rounded-xl px-3.5 py-2.5 text-left transition-all active:scale-[0.98]",
                  selected
                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="block text-sm font-semibold">
                  {formatDurationLabel(option.durationMinutes)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatPriceFromCents(option.priceCents, currency)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <IosSectionLabel>
          Bookings this day
          {sortedBookings.length > 0 ? ` (${sortedBookings.length})` : ""}
        </IosSectionLabel>

        {shiftWindow.shiftStartsAt && shiftWindow.shiftEndsAt ? (
          <ShiftTimelineBar
            shiftStartIso={shiftWindow.shiftStartsAt}
            shiftEndIso={shiftWindow.shiftEndsAt}
            startedAtIso={staff.attributes.shiftStartsAt ?? null}
            bookings={sortedBookings}
            timeZone={tenant.settings.timezone}
            className="mb-3 px-1"
          />
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-soft">
          {sortedBookings.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No bookings yet
            </p>
          ) : (
            <ul className="divide-y divide-border/50">
              {sortedBookings.map((booking) => {
                const inProgress = isBookingOccupyingRoom(booking);

                return (
                  <li
                    key={booking.id}
                    className="flex items-start gap-3 px-4 py-3.5"
                  >
                    <div className="mt-0.5 min-w-[4.5rem] text-sm font-semibold tabular-nums text-primary">
                      {formatAmPmTime(booking.startsAt)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">
                        {inProgress ? (
                          <span className="mr-1.5 text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
                            Now
                          </span>
                        ) : null}
                        {formatBookingSummary(booking)}
                        {booking.priceCents > 0
                          ? ` · ${formatPriceFromCents(booking.priceCents, currency)}`
                          : ""}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {booking.customerName ?? "Walk-in"}
                        {booking.customerPhone
                          ? ` · ${booking.customerPhone}`
                          : ""}
                        {booking.roomName ? ` · ${booking.roomName}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <BookingCompactTimePicker
        date={date}
        timeZone={tenant.settings.timezone}
        durationMinutes={durationMinutes}
        slotOptions={timeSlotOptions}
        selectedValue=""
        onSelect={(slot) => onAddBooking(slot, durationMinutes)}
        loading={timeSlotsLoading}
        hint={timeSlotsHint}
        emptyMessage="No open slots for this day."
        instantSelect
        variant="admin"
      />
    </div>
  );
}
