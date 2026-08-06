"use client";

import {
  BUSINESS_DAY_LABELS,
  BUSINESS_DAY_ORDER,
} from "@/features/business";
import type { DayOfWeek, OpeningHours } from "@/types/salon";
import { cn } from "@/lib/utils";

type BusinessHoursEditorProps = {
  value: OpeningHours;
  onChange: (next: OpeningHours) => void;
};

export function BusinessHoursEditor({
  value,
  onChange,
}: BusinessHoursEditorProps) {
  function updateDay(
    day: DayOfWeek,
    patch: Partial<NonNullable<OpeningHours[DayOfWeek]>>,
  ) {
    const current = value[day] ?? {
      open: "09:00",
      close: "17:00",
      closed: false,
    };
    onChange({
      ...value,
      [day]: { ...current, ...patch },
    });
  }

  return (
    <div className="space-y-2">
      {BUSINESS_DAY_ORDER.map((day) => {
        const row = value[day] ?? {
          open: "09:00",
          close: "17:00",
          closed: false,
        };
        return (
          <div
            key={day}
            className={cn(
              "grid items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 sm:grid-cols-[110px_1fr_auto]",
            )}
          >
            <p className="text-sm font-medium text-neutral-900">
              {BUSINESS_DAY_LABELS[day]}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="time"
                disabled={row.closed}
                value={row.open}
                onChange={(e) => updateDay(day, { open: e.target.value })}
                className="h-9 rounded-xl border border-neutral-200 px-2 text-sm disabled:opacity-40"
              />
              <span className="text-neutral-400">–</span>
              <input
                type="time"
                disabled={row.closed}
                value={row.close}
                onChange={(e) => updateDay(day, { close: e.target.value })}
                className="h-9 rounded-xl border border-neutral-200 px-2 text-sm disabled:opacity-40"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-[13px] text-neutral-600">
              <input
                type="checkbox"
                checked={row.closed}
                onChange={(e) => updateDay(day, { closed: e.target.checked })}
                className="size-4 rounded border-neutral-300"
              />
              Closed
            </label>
          </div>
        );
      })}
    </div>
  );
}
