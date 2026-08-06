"use client";

import {
  STAFF_DAY_LABELS,
  STAFF_DAYS,
  type StaffWorkingDay,
} from "@/features/salon-staff";
import { cn } from "@/lib/utils";

const timeClass =
  "h-10 rounded-xl border border-neutral-200 bg-white px-3 text-[13px] outline-none focus:border-neutral-400";

type WorkingHoursProps = {
  value: StaffWorkingDay[];
  onChange: (next: StaffWorkingDay[]) => void;
  className?: string;
};

export function WorkingHours({ value, onChange, className }: WorkingHoursProps) {
  function patchDay(dayOfWeek: StaffWorkingDay["dayOfWeek"], partial: Partial<StaffWorkingDay>) {
    onChange(
      value.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...partial } : day,
      ),
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-neutral-200", className)}>
      {STAFF_DAYS.map((dayKey) => {
        const day =
          value.find((d) => d.dayOfWeek === dayKey) ?? {
            dayOfWeek: dayKey,
            startTime: "09:00",
            endTime: "17:00",
            isDayOff: true,
          };
        return (
          <div
            key={dayKey}
            className="grid grid-cols-[110px_1fr] items-center gap-3 border-b border-neutral-100 px-3 py-2.5 last:border-b-0 sm:grid-cols-[130px_auto_1fr_auto_1fr]"
          >
            <span className="text-[13px] font-medium text-neutral-800">
              {STAFF_DAY_LABELS[dayKey]}
            </span>
            <label className="flex items-center gap-2 text-[12px] text-neutral-600">
              <input
                type="checkbox"
                checked={day.isDayOff}
                onChange={(e) => patchDay(dayKey, { isDayOff: e.target.checked })}
              />
              Off
            </label>
            <input
              type="time"
              className={cn(timeClass, day.isDayOff && "opacity-40")}
              disabled={day.isDayOff}
              value={day.startTime}
              onChange={(e) => patchDay(dayKey, { startTime: e.target.value })}
            />
            <span className="hidden text-neutral-400 sm:inline">–</span>
            <input
              type="time"
              className={cn(timeClass, day.isDayOff && "opacity-40")}
              disabled={day.isDayOff}
              value={day.endTime}
              onChange={(e) => patchDay(dayKey, { endTime: e.target.value })}
            />
          </div>
        );
      })}
    </div>
  );
}
