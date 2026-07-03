"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppAvatar } from "@/components/common";
import { cn } from "@/lib/utils";
import {
  formatPriceFromCents,
  type ServiceOption,
} from "@/features/services";
import type { StaffRecord } from "@/features/staff/types";

import {
  buildStartsAtIso,
  formatAmPmTime,
  formatBookingSummary,
  formatDurationLabel,
  formatScheduleDate,
  getAvailableStartSlots,
  groupTimeSlotsByHour,
} from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";

interface StaffScheduleDetailProps {
  staff: StaffRecord;
  date: string;
  bookings: AdminBooking[];
  serviceOptions: ServiceOption[];
  currency?: string;
  onAddBooking: (startsAt: string, durationMinutes: number) => void;
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
  onAddBooking,
}: StaffScheduleDetailProps) {
  const [durationMinutes, setDurationMinutes] = useState(
    serviceOptions[0]?.durationMinutes ?? 30,
  );
  const [expandedHours, setExpandedHours] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (serviceOptions[0]?.durationMinutes) {
      setDurationMinutes(serviceOptions[0].durationMinutes);
    }
  }, [serviceOptions]);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [bookings],
  );

  const availableSlots = useMemo(
    () =>
      getAvailableStartSlots(
        date,
        staff.workingHoursStart,
        staff.workingHoursEnd,
        sortedBookings,
        durationMinutes,
      ),
    [
      date,
      durationMinutes,
      sortedBookings,
      staff.workingHoursEnd,
      staff.workingHoursStart,
    ],
  );

  const slotGroups = useMemo(
    () => groupTimeSlotsByHour(date, availableSlots),
    [availableSlots, date],
  );

  useEffect(() => {
    if (slotGroups.length === 0) {
      setExpandedHours(new Set());
      return;
    }

    const first = slotGroups[0]?.hourLabel;
    if (first) {
      setExpandedHours(new Set([first]));
    }
  }, [durationMinutes, slotGroups]);

  const toggleHour = (hourLabel: string) => {
    setExpandedHours((current) => {
      const next = new Set(current);
      if (next.has(hourLabel)) {
        next.delete(hourLabel);
      } else {
        next.add(hourLabel);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-6">
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
          Today&apos;s bookings
          {sortedBookings.length > 0 ? ` (${sortedBookings.length})` : ""}
        </IosSectionLabel>
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-soft">
          {sortedBookings.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No bookings yet
            </p>
          ) : (
            <ul className="divide-y divide-border/50">
              {sortedBookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-start gap-3 px-4 py-3.5"
                >
                  <div className="mt-0.5 min-w-[4.5rem] text-sm font-semibold tabular-nums text-primary">
                    {formatAmPmTime(booking.startsAt)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">
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
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <IosSectionLabel>
          Pick a time · {formatDurationLabel(durationMinutes)}
        </IosSectionLabel>

        {slotGroups.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-card px-4 py-6 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">
              No open slots in working hours.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {slotGroups.map((group) => {
              const expanded = expandedHours.has(group.hourLabel);
              return (
                <div
                  key={group.hourLabel}
                  className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-soft"
                >
                  <button
                    type="button"
                    onClick={() => toggleHour(group.hourLabel)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted/40"
                  >
                    {expanded ? (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 text-sm font-semibold">
                      {group.hourLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {group.slots.length} open
                    </span>
                  </button>

                  {expanded ? (
                    <div className="border-t border-border/40 bg-muted/25 px-3 py-3">
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {group.slots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => onAddBooking(slot, durationMinutes)}
                            className="rounded-xl bg-background py-2.5 text-sm font-medium tabular-nums shadow-sm ring-1 ring-black/5 transition active:scale-[0.97] active:bg-primary active:text-primary-foreground"
                          >
                            {formatAmPmTime(buildStartsAtIso(date, slot))}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
