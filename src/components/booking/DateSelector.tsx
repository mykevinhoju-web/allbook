"use client";

import { cn } from "@/lib/utils";

type DateSelectorProps = {
  value: string;
  onChange: (date: string) => void;
  /** Number of upcoming days to offer */
  days?: number;
  className?: string;
};

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function labelFor(iso: string): { weekday: string; day: string; month: string } {
  const date = new Date(`${iso}T12:00:00`);
  return {
    weekday: date.toLocaleDateString("en-AU", { weekday: "short" }),
    day: date.toLocaleDateString("en-AU", { day: "numeric" }),
    month: date.toLocaleDateString("en-AU", { month: "short" }),
  };
}

export function DateSelector({
  value,
  onChange,
  days = 14,
  className,
}: DateSelectorProps) {
  const start = todayIso();
  const options = Array.from({ length: days }, (_, i) => addDays(start, i));

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((iso) => {
        const active = value === iso;
        const label = labelFor(iso);
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onChange(iso)}
            className={cn(
              "min-w-[72px] shrink-0 rounded-2xl border px-3 py-3 text-center transition",
              active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300",
            )}
          >
            <span className="block text-[11px] font-medium opacity-70">
              {label.weekday}
            </span>
            <span className="mt-1 block text-[18px] font-semibold tabular-nums">
              {label.day}
            </span>
            <span className="block text-[11px] opacity-70">{label.month}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Alias used by some flows */
export function BookingCalendar(props: DateSelectorProps) {
  return <DateSelector {...props} />;
}
