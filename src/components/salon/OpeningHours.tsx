import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_ORDER,
  todayDayKey,
} from "@/features/salon";
import type { OpeningHours } from "@/types/salon";
import { cn } from "@/lib/utils";

type OpeningHoursProps = {
  hours: OpeningHours;
};

export function OpeningHoursList({ hours }: OpeningHoursProps) {
  const today = todayDayKey();

  if (DAY_OF_WEEK_ORDER.every((day) => !hours[day])) {
    return (
      <p className="text-sm text-neutral-500">Opening hours unavailable.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {DAY_OF_WEEK_ORDER.map((day) => {
        const row = hours[day];
        const isToday = day === today;
        return (
          <li
            key={day}
            className={cn(
              "flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm",
              isToday ? "bg-neutral-950 text-white" : "text-neutral-700",
            )}
          >
            <span className={cn("font-medium", isToday && "text-white")}>
              {DAY_OF_WEEK_LABELS[day]}
              {isToday ? (
                <span className="ml-2 text-[11px] font-normal text-white/70">
                  Today
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                "tabular-nums",
                isToday ? "text-white/90" : "text-neutral-500",
              )}
            >
              {!row || row.closed
                ? "Closed"
                : `${row.open} – ${row.close}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
