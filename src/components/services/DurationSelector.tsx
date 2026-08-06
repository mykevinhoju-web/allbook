"use client";

import {
  SERVICE_DURATION_OPTIONS,
  formatDurationLabel,
} from "@/features/salon-services";
import { cn } from "@/lib/utils";

type DurationSelectorProps = {
  value: number;
  onChange: (minutes: number) => void;
  className?: string;
};

export function DurationSelector({
  value,
  onChange,
  className,
}: DurationSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {SERVICE_DURATION_OPTIONS.map((minutes) => {
        const active = value === minutes;
        return (
          <button
            key={minutes}
            type="button"
            onClick={() => onChange(minutes)}
            className={cn(
              "min-w-[72px] rounded-xl border px-3 py-2 text-[13px] font-medium transition",
              active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
            )}
          >
            {formatDurationLabel(minutes)}
          </button>
        );
      })}
    </div>
  );
}
