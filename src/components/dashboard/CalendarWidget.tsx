import Link from "next/link";

import type { DashboardCalendarSlot } from "@/features/dashboard";
import { cn } from "@/lib/utils";

type CalendarWidgetProps = {
  slots: DashboardCalendarSlot[];
  className?: string;
};

export function CalendarWidget({ slots, className }: CalendarWidgetProps) {
  return (
    <section
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-950">
            Calendar preview
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Today’s schedule
          </p>
        </div>
        <Link
          href="/platform/salon/calendar"
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          Open
        </Link>
      </div>

      <div className="max-h-[420px] flex-1 space-y-1.5 overflow-y-auto px-3 py-3 sm:px-4">
        {slots.map((slot) => (
          <div
            key={slot.time}
            className={cn(
              "grid grid-cols-[56px_1fr] items-stretch gap-2 rounded-2xl px-2 py-1.5 transition",
              slot.booking ? "hover:bg-[#F7F8FA]" : "opacity-70",
            )}
          >
            <div className="pt-2 text-[12px] font-medium tabular-nums text-neutral-500">
              {slot.time}
            </div>
            {slot.booking ? (
              <div className="rounded-2xl border border-[#D9E4FF] bg-gradient-to-r from-[#EEF3FF] to-white px-3 py-2.5 transition hover:border-[#B8CBFF]">
                <p className="text-[13px] font-semibold text-neutral-900">
                  {slot.booking.customerName}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                  {slot.booking.service} · {slot.booking.staff}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-200 px-3 py-2.5 text-[12px] text-neutral-400">
                Available
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
