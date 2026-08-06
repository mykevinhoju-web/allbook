"use client";

import { SALON_BOOKING_TIME_SLOTS } from "@/features/salon";
import type { SalonServiceItem, SalonStaffMember } from "@/types/salon";
import { cn } from "@/lib/utils";

export type BookingSelection = {
  service: SalonServiceItem | null;
  staff: SalonStaffMember | null;
  date: string;
  time: string;
};

type BookingSidebarProps = {
  selection: BookingSelection;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onBook: () => void;
  className?: string;
  compact?: boolean;
};

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function BookingSidebar({
  selection,
  onDateChange,
  onTimeChange,
  onBook,
  className,
  compact = false,
}: BookingSidebarProps) {
  const estimatedPrice = selection.service?.price ?? null;
  const canBook = Boolean(
    selection.service && selection.date && selection.time,
  );

  return (
    <aside
      className={cn(
        "rounded-3xl border border-neutral-200/80 bg-white shadow-[0_16px_48px_rgba(17,17,17,0.06)]",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      )}
    >
      {!compact ? (
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            Book an appointment
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Review your selection and continue
          </p>
        </div>
      ) : null}

      <dl className="space-y-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-neutral-500">Service</dt>
          <dd className="max-w-[60%] text-right font-medium text-neutral-950">
            {selection.service?.name ?? "Select a service"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-neutral-500">Staff</dt>
          <dd className="max-w-[60%] text-right font-medium text-neutral-950">
            {selection.staff?.name ?? "Any available"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-neutral-500">
            Date
          </span>
          <input
            type="date"
            min={todayInputValue()}
            value={selection.date}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-400"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-neutral-500">
            Time
          </span>
          <select
            value={selection.time}
            onChange={(event) => onTimeChange(event.target.value)}
            className="h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-400"
          >
            <option value="">Select time</option>
            {SALON_BOOKING_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
        <span className="text-sm text-neutral-500">Estimated</span>
        <span className="text-xl font-semibold tabular-nums tracking-tight text-neutral-950">
          {estimatedPrice != null ? `$${estimatedPrice}` : "—"}
        </span>
      </div>

      <button
        type="button"
        disabled={!canBook}
        onClick={onBook}
        className={cn(
          "mt-4 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold transition active:scale-[0.99]",
          canBook
            ? "bg-neutral-950 text-white hover:bg-neutral-800"
            : "cursor-not-allowed bg-neutral-200 text-neutral-500",
        )}
      >
        Book now
      </button>
    </aside>
  );
}
