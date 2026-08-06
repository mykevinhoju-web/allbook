"use client";

import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/features/salon-booking/types";

type TimeSlotSelectorProps = {
  slots: TimeSlot[];
  value: string | null;
  onChange: (startTime: string) => void;
};

export function TimeSlotSelector({
  slots,
  value,
  onChange,
}: TimeSlotSelectorProps) {
  const available = slots.filter((s) => s.available);

  if (available.length === 0) {
    return (
      <p className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
        No available times on this day.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {available.map((slot) => {
        const active = value === slot.startTime;
        return (
          <button
            key={slot.startTime}
            type="button"
            onClick={() => onChange(slot.startTime)}
            className={cn(
              "rounded-xl border px-2 py-2.5 text-sm font-semibold tabular-nums transition",
              active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300",
            )}
          >
            {slot.startTime}
          </button>
        );
      })}
    </div>
  );
}

/** Alias */
export function TimeSlotGrid(props: TimeSlotSelectorProps) {
  return <TimeSlotSelector {...props} />;
}
