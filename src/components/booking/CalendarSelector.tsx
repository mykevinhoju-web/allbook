"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type CalendarSelectorProps = {
  value: string;
  onChange: (date: string) => void;
  /** Return true to disable a YYYY-MM-DD date */
  isDisabled?: (dateIso: string) => boolean;
  className?: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIso(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function CalendarSelector({
  value,
  onChange,
  isDisabled,
  className,
}: CalendarSelectorProps) {
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [cursor, setCursor] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });

  const weeks = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startPad = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: Array<{ iso: string; day: number; inMonth: boolean }[]> = [];
    let week: { iso: string; day: number; inMonth: boolean }[] = [];

    for (let i = 0; i < startPad; i += 1) {
      week.push({ iso: "", day: 0, inMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      week.push({
        iso: toIso(cursor.year, cursor.month, day),
        day,
        inMonth: true,
      });
      if (week.length === 7) {
        cells.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push({ iso: "", day: 0, inMonth: false });
      cells.push(week);
    }
    return cells;
  }, [cursor.month, cursor.year]);

  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-AU",
    { month: "long", year: "numeric" },
  );

  const today = todayIso();

  return (
    <div className={cn("rounded-2xl border border-neutral-200 bg-white p-4", className)}>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() =>
            setCursor((c) => {
              const month = c.month - 1;
              if (month < 0) return { year: c.year - 1, month: 11 };
              return { year: c.year, month };
            })
          }
          className="inline-flex size-9 items-center justify-center rounded-full border border-neutral-200"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold text-neutral-950">{label}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() =>
            setCursor((c) => {
              const month = c.month + 1;
              if (month > 11) return { year: c.year + 1, month: 0 };
              return { year: c.year, month };
            })
          }
          className="inline-flex size-9 items-center justify-center rounded-full border border-neutral-200"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-neutral-400">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((cell, index) => {
          if (!cell.inMonth) {
            return <div key={`empty-${index}`} className="h-10" />;
          }
          const disabled = Boolean(isDisabled?.(cell.iso)) || cell.iso < today;
          const active = value === cell.iso;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cell.iso)}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-xl text-sm font-medium transition",
                active && "bg-neutral-950 text-white",
                !active &&
                  !disabled &&
                  "text-neutral-800 hover:bg-neutral-100",
                disabled && "cursor-not-allowed text-neutral-300",
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Alias */
export function DateSelector(
  props: CalendarSelectorProps & { days?: number },
) {
  return <CalendarSelector {...props} />;
}

export function BookingCalendar(props: CalendarSelectorProps) {
  return <CalendarSelector {...props} />;
}
