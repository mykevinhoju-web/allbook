"use client";

import { Plus, Trash2 } from "lucide-react";

import {
  STAFF_BREAK_TYPES,
  STAFF_DAY_LABELS,
  STAFF_DAYS,
  type StaffBreak,
  type StaffBreakType,
  type StaffDayOfWeek,
} from "@/features/salon-staff";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 rounded-xl border border-neutral-200 bg-white px-3 text-[13px] outline-none focus:border-neutral-400";

type BreakManagerProps = {
  value: StaffBreak[];
  onChange: (next: StaffBreak[]) => void;
  className?: string;
};

export function BreakManager({ value, onChange, className }: BreakManagerProps) {
  function addBreak() {
    onChange([
      ...value,
      {
        id: `brk_${crypto.randomUUID().slice(0, 8)}`,
        dayOfWeek: 0,
        startTime: "13:00",
        endTime: "13:30",
        breakType: "lunch",
        label: "Lunch",
      },
    ]);
  }

  function patch(id: string, partial: Partial<StaffBreak>) {
    onChange(value.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  }

  function remove(id: string) {
    onChange(value.filter((item) => item.id !== id));
  }

  return (
    <div className={cn("space-y-3", className)}>
      {value.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-6 text-center text-[13px] text-neutral-500">
          No breaks yet. Add lunch, coffee, or custom breaks for the booking engine.
        </p>
      ) : null}

      {value.map((item) => (
        <div
          key={item.id}
          className="grid gap-2 rounded-2xl border border-neutral-200 bg-[#FAFBFC] p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"
        >
          <select
            className={fieldClass}
            value={item.dayOfWeek}
            onChange={(e) =>
              patch(item.id, {
                dayOfWeek: Number(e.target.value) as StaffDayOfWeek,
              })
            }
          >
            {STAFF_DAYS.map((d) => (
              <option key={d} value={d}>
                {STAFF_DAY_LABELS[d]}
              </option>
            ))}
          </select>
          <select
            className={fieldClass}
            value={item.breakType}
            onChange={(e) => {
              const breakType = e.target.value as StaffBreakType;
              const label =
                STAFF_BREAK_TYPES.find((t) => t.id === breakType)?.label ??
                item.label;
              patch(item.id, { breakType, label });
            }}
          >
            {STAFF_BREAK_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="time"
            className={fieldClass}
            value={item.startTime}
            onChange={(e) => patch(item.id, { startTime: e.target.value })}
          />
          <input
            type="time"
            className={fieldClass}
            value={item.endTime}
            onChange={(e) => patch(item.id, { endTime: e.target.value })}
          />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600"
            onClick={() => remove(item.id)}
            aria-label="Remove break"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addBreak}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-50"
      >
        <Plus className="size-4" />
        Add break
      </button>
    </div>
  );
}
