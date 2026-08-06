"use client";

import { Plus, Trash2 } from "lucide-react";

import {
  STAFF_LEAVE_TYPES,
  type StaffLeave,
  type StaffLeaveType,
} from "@/features/salon-staff";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[13px] outline-none focus:border-neutral-400";

type LeaveManagerProps = {
  value: StaffLeave[];
  onChange: (next: StaffLeave[]) => void;
  className?: string;
};

export function LeaveManager({ value, onChange, className }: LeaveManagerProps) {
  function addLeave() {
    const today = new Date().toISOString().slice(0, 10);
    onChange([
      ...value,
      {
        id: `leave_${crypto.randomUUID().slice(0, 8)}`,
        startDate: today,
        endDate: today,
        leaveType: "annual",
        reason: "",
      },
    ]);
  }

  function patch(id: string, partial: Partial<StaffLeave>) {
    onChange(value.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  }

  function remove(id: string) {
    onChange(value.filter((item) => item.id !== id));
  }

  return (
    <div className={cn("space-y-3", className)}>
      {value.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-6 text-center text-[13px] text-neutral-500">
          No time off recorded. Leave blocks availability for the booking engine.
        </p>
      ) : null}

      {value.map((item) => (
        <div
          key={item.id}
          className="space-y-2 rounded-2xl border border-neutral-200 bg-[#FAFBFC] p-3"
        >
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <select
              className={fieldClass}
              value={item.leaveType}
              onChange={(e) =>
                patch(item.id, { leaveType: e.target.value as StaffLeaveType })
              }
            >
              {STAFF_LEAVE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              className={fieldClass}
              value={item.startDate}
              onChange={(e) => patch(item.id, { startDate: e.target.value })}
            />
            <input
              type="date"
              className={fieldClass}
              value={item.endDate}
              onChange={(e) => patch(item.id, { endDate: e.target.value })}
            />
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600"
              onClick={() => remove(item.id)}
              aria-label="Remove leave"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <input
            className={fieldClass}
            placeholder="Reason (optional)"
            value={item.reason}
            onChange={(e) => patch(item.id, { reason: e.target.value })}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addLeave}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-50"
      >
        <Plus className="size-4" />
        Add time off
      </button>
    </div>
  );
}
