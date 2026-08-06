"use client";

import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/features/salon-booking/types";

type TimeSlotGridProps = {
  slots: TimeSlot[];
  value: string | null;
  onChange: (startTime: string) => void;
  emptyMessage?: string;
};

export function TimeSlotGrid({
  slots,
  value,
  onChange,
  emptyMessage = "No times available for this date.",
}: TimeSlotGridProps) {
  const available = slots.filter((s) => s.available);

  if (available.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-neutral-300 bg-white px-5 py-12 text-center text-[14px] text-neutral-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {available.map((slot) => {
        const active = value === slot.startTime;
        return (
          <button
            key={slot.startTime}
            type="button"
            onClick={() => onChange(slot.startTime)}
            className={cn(
              "rounded-2xl border px-3 py-3 text-[14px] font-semibold tabular-nums transition",
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
