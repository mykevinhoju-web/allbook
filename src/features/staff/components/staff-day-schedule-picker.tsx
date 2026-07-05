"use client";

import { cn } from "@/lib/utils";
import { formatScheduleDate } from "@/features/booking/lib/schedule-utils";

import {
  isStaffWorkingOnDate,
  upcomingScheduleDates,
  type StaffDaySchedule,
} from "../utils/day-schedule";
import type { StaffStatus } from "../types";

interface StaffDaySchedulePickerProps {
  daySchedule: StaffDaySchedule;
  timeZone: string;
  status: StaffStatus;
  onChange: (daySchedule: StaffDaySchedule) => void;
  days?: number;
}

export function StaffDaySchedulePicker({
  daySchedule,
  timeZone,
  status,
  onChange,
  days = 28,
}: StaffDaySchedulePickerProps) {
  const dates = upcomingScheduleDates(timeZone, days);

  const toggleDate = (date: string) => {
    const working = !isStaffWorkingOnDate(status, daySchedule, date);
    const next = { ...daySchedule };
    if (working) {
      delete next[date];
    } else {
      next[date] = false;
    }
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {dates.map((date) => {
        const working = isStaffWorkingOnDate(status, daySchedule, date);
        const isToday = date === upcomingScheduleDates(timeZone, 1)[0];

        return (
          <button
            key={date}
            type="button"
            onClick={() => toggleDate(date)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98]",
              working
                ? "border-emerald-500/40 bg-emerald-500/10 text-foreground"
                : "border-border/60 bg-muted/40 text-muted-foreground",
            )}
          >
            <span className="block text-xs font-medium uppercase tracking-wide opacity-70">
              {isToday ? "Today" : formatScheduleDate(`${date}T12:00:00`)}
            </span>
            <span className="mt-0.5 block text-sm font-semibold">
              {working ? "Working" : "Off"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
