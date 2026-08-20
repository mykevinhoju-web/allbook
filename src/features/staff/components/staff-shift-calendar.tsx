"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Moon, Trash2 } from "lucide-react";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { formatDisplayDate } from "@/lib/display-locale";
import { AppButton } from "@/components/common";
import { cn } from "@/lib/utils";
import {
  addDaysToDateInput,
  formatShiftDateTime,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";

import {
  DEFAULT_SHIFT_END_TIME,
  DEFAULT_SHIFT_START_TIME,
  durationHoursForEntry,
  formatDateInput,
  parseDateInput,
} from "../utils/shift-calendar";
import {
  activeOvernightAnchorDates,
  formatShiftPlanDayLabel,
  isOvernightShift,
  resolveShiftForCalendarDate,
  shiftPlanDayToWindow,
  sortedShiftPlanDates,
  spilloverAnchorForDate,
  tailDatesForPlan,
  type DayShiftEntry,
  type ShiftPlan,
} from "../utils/shift-plan";

interface StaffShiftCalendarProps {
  timeZone: string;
  shiftPlan: ShiftPlan;
  localNow: string;
  onShiftPlanChange: (plan: ShiftPlan) => void;
}

function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });
}

/** Parse "HH:mm" (24h) into 12-hour parts with English AM/PM. */
function parseClockToAmPm(value: string): {
  hour12: number;
  minute: number;
  period: "AM" | "PM";
} {
  const [hRaw = "0", mRaw = "0"] = value.split(":");
  const hour24 = Number(hRaw) % 24;
  const minute = Number(mRaw) || 0;
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { hour12, minute, period };
}

function toClock24(
  hour12: number,
  minute: number,
  period: "AM" | "PM",
): string {
  let hour24 = hour12 % 12;
  if (period === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

function AmPmTimeSelect({
  value,
  onChange,
  min,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  min?: string;
  "aria-label": string;
}) {
  const parts = parseClockToAmPm(value);
  const minute =
    MINUTE_OPTIONS.reduce((best, option) =>
      Math.abs(option - parts.minute) < Math.abs(best - parts.minute)
        ? option
        : best,
    ) ?? 0;

  const commit = (
    next: Partial<{ hour12: number; minute: number; period: "AM" | "PM" }>,
  ) => {
    const hour12 = next.hour12 ?? parts.hour12;
    const nextMinute = next.minute ?? minute;
    const period = next.period ?? parts.period;
    let clock = toClock24(hour12, nextMinute, period);
    if (min && clock < min) clock = min;
    onChange(clock);
  };

  const selectClassName = cn(
    "h-11 min-w-0 flex-1 appearance-none rounded-xl border border-border/60 bg-background px-3 text-sm font-semibold tabular-nums",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
  );

  return (
    <div className="flex gap-2" aria-label={ariaLabel} lang="en">
      <select
        aria-label={`${ariaLabel} hour`}
        className={selectClassName}
        value={parts.hour12}
        onChange={(event) => commit({ hour12: Number(event.target.value) })}
      >
        {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <select
        aria-label={`${ariaLabel} minute`}
        className={selectClassName}
        value={minute}
        onChange={(event) => commit({ minute: Number(event.target.value) })}
      >
        {MINUTE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {String(option).padStart(2, "0")}
          </option>
        ))}
      </select>
      <select
        aria-label={`${ariaLabel} AM or PM`}
        className={cn(selectClassName, "max-w-[5.5rem]")}
        value={parts.period}
        onChange={(event) =>
          commit({ period: event.target.value as "AM" | "PM" })
        }
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

function defaultEntryFromPlan(
  shiftPlan: ShiftPlan,
  focusedDate: string,
): DayShiftEntry {
  if (shiftPlan[focusedDate]) {
    return { ...shiftPlan[focusedDate] };
  }

  const templateDate = sortedShiftPlanDates(shiftPlan).at(-1);
  if (templateDate && shiftPlan[templateDate]) {
    return { ...shiftPlan[templateDate] };
  }

  return {
    startTime: DEFAULT_SHIFT_START_TIME,
    endTime: DEFAULT_SHIFT_END_TIME,
  };
}

function ScheduleDayButton({
  shiftPlan,
  today,
  activeOvernightAnchors,
  onDayClick,
  ...props
}: React.ComponentProps<typeof CalendarDayButton> & {
  shiftPlan: ShiftPlan;
  today: string;
  activeOvernightAnchors: string[];
  onDayClick: (day: Date) => void;
}) {
  const dateKey = formatDateInput(props.day.date);
  const showMarkers =
    dateKey >= today || activeOvernightAnchors.includes(dateKey);
  const entry = showMarkers ? shiftPlan[dateKey] : undefined;
  const label = showMarkers
    ? formatShiftPlanDayLabel(dateKey, shiftPlan)
    : null;
  const isTail =
    showMarkers &&
    !entry &&
    Boolean(spilloverAnchorForDate(shiftPlan, dateKey));

  return (
    <CalendarDayButton
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onDayClick(props.day.date);
      }}
    >
      <span className="text-sm leading-none sm:text-base">
        {props.day.date.getDate()}
      </span>
      {label ? (
        <span
          className={cn(
            "max-w-full truncate text-[8px] font-semibold leading-none sm:text-[9px]",
            entry ? "text-primary" : "text-primary/70",
          )}
        >
          {label}
        </span>
      ) : entry ? (
        <span className="size-1 rounded-full bg-primary" />
      ) : isTail ? (
        <span className="size-1 rounded-full bg-primary/40" />
      ) : null}
    </CalendarDayButton>
  );
}

function formatShortDate(date: string): string {
  return formatDisplayDate(parseDateInput(date), {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function StaffShiftCalendar({
  timeZone,
  shiftPlan,
  localNow,
  onShiftPlanChange,
}: StaffShiftCalendarProps) {
  const today = todayDateInZone(timeZone);
  const activeOvernightAnchors = useMemo(
    () => activeOvernightAnchorDates(shiftPlan, today, timeZone),
    [shiftPlan, today, timeZone, localNow],
  );
  const upcomingDates = useMemo(() => {
    const future = sortedShiftPlanDates(shiftPlan).filter(
      (date) => date >= today,
    );
    const merged = [...activeOvernightAnchors, ...future];
    return [...new Set(merged)].sort();
  }, [shiftPlan, today, activeOvernightAnchors]);
  const scheduledDates = useMemo(
    () => upcomingDates.map((date) => parseDateInput(date)),
    [upcomingDates],
  );
  const tailDates = useMemo(
    () =>
      tailDatesForPlan(shiftPlan)
        .filter((date) => date >= today)
        .map((date) => parseDateInput(date)),
    [shiftPlan, today],
  );

  const [focusedDate, setFocusedDate] = useState(() => {
    const liveOvernight = activeOvernightAnchorDates(
      shiftPlan,
      today,
      timeZone,
    );
    if (liveOvernight[0]) return liveOvernight[0];
    // Prefer today when an overnight spillover covers this morning.
    if (resolveShiftForCalendarDate(shiftPlan, today, timeZone)?.isTailOnly) {
      return today;
    }
    const dates = sortedShiftPlanDates(shiftPlan);
    return dates.find((date) => date >= today) ?? today;
  });

  const [visibleMonth, setVisibleMonth] = useState(() =>
    parseDateInput(focusedDate),
  );

  const focusedShift = useMemo(
    () => resolveShiftForCalendarDate(shiftPlan, focusedDate, timeZone),
    [shiftPlan, focusedDate, timeZone],
  );
  const focusedEntry: DayShiftEntry = shiftPlan[focusedDate] ?? {
    startTime: DEFAULT_SHIFT_START_TIME,
    endTime: DEFAULT_SHIFT_END_TIME,
  };
  const focusedOvernight = isOvernightShift(focusedEntry);
  const isTailFocus = Boolean(focusedShift?.isTailOnly);
  const isActivePastOvernight = activeOvernightAnchors.includes(focusedDate);

  const minSelectableDate = parseDateInput(
    activeOvernightAnchors[0] ?? today,
  );
  const canGoPrevMonth =
    visibleMonth.getFullYear() > minSelectableDate.getFullYear() ||
    (visibleMonth.getFullYear() === minSelectableDate.getFullYear() &&
      visibleMonth.getMonth() > minSelectableDate.getMonth());

  const focusDate = (key: string) => {
    setFocusedDate(key);
    setVisibleMonth(parseDateInput(key));
  };

  const updateFocusedEntry = (patch: Partial<DayShiftEntry>) => {
    if (!shiftPlan[focusedDate]) return;

    const nextEntry = { ...shiftPlan[focusedDate], ...patch };
    onShiftPlanChange({
      ...shiftPlan,
      [focusedDate]: nextEntry,
    });
  };

  const handleDayClick = (day: Date) => {
    const key = formatDateInput(day);
    const allowedPast = activeOvernightAnchors.includes(key);
    if (key < today && !allowedPast) return;

    // Any future date is selectable — including overnight "tail" mornings.
    if (shiftPlan[key]) {
      focusDate(key);
      return;
    }

    focusDate(key);
  };

  const startShiftOnFocusedDay = () => {
    if (shiftPlan[focusedDate]) return;
    onShiftPlanChange({
      ...shiftPlan,
      [focusedDate]: defaultEntryFromPlan(shiftPlan, focusedDate),
    });
  };

  const removeFocusedDay = () => {
    if (!shiftPlan[focusedDate]) return;

    const nextPlan = { ...shiftPlan };
    delete nextPlan[focusedDate];
    onShiftPlanChange(nextPlan);

    const remaining = sortedShiftPlanDates(nextPlan);
    const nextFocus =
      remaining.find((date) => date >= today) ??
      activeOvernightAnchorDates(nextPlan, today, timeZone)[0] ??
      today;
    focusDate(nextFocus);
  };

  const applyHoursToAll = () => {
    const nextPlan: ShiftPlan = { ...shiftPlan };
    for (const date of upcomingDates) {
      nextPlan[date] = { ...focusedEntry };
    }
    onShiftPlanChange(nextPlan);
  };

  const focusedWindow = shiftPlan[focusedDate]
    ? shiftPlanDayToWindow(focusedDate, shiftPlan[focusedDate], timeZone)
    : null;

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2 py-2 sm:px-3">
          <AppButton
            type="button"
            variant="outline"
            className="size-9 shrink-0 rounded-xl p-0 sm:size-10"
            aria-label="Previous month"
            disabled={!canGoPrevMonth}
            onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
          >
            <ChevronLeft className="size-5" />
          </AppButton>
          <label className="sr-only" htmlFor="staff-shift-month">
            Select month
          </label>
          <select
            id="staff-shift-month"
            className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-center text-sm font-semibold sm:h-10 sm:text-base"
            value={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}`}
            onChange={(event) => {
              const [year, month] = event.target.value.split("-").map(Number);
              setVisibleMonth(new Date(year!, month!, 1));
            }}
          >
            {Array.from({ length: 18 }, (_, index) => {
              const base = new Date(
                minSelectableDate.getFullYear(),
                minSelectableDate.getMonth() + index,
                1,
              );
              return (
                <option
                  key={`${base.getFullYear()}-${base.getMonth()}`}
                  value={`${base.getFullYear()}-${base.getMonth()}`}
                >
                  {formatMonthYear(base)}
                </option>
              );
            })}
          </select>
          <AppButton
            type="button"
            variant="outline"
            className="size-9 shrink-0 rounded-xl p-0 sm:size-10"
            aria-label="Next month"
            onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
          >
            <ChevronRight className="size-5" />
          </AppButton>
        </div>
        <Calendar
          mode="single"
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          selected={parseDateInput(focusedDate)}
          onSelect={(date) => {
            if (date) handleDayClick(date);
          }}
          disabled={{ before: minSelectableDate }}
          modifiers={{
            scheduled: scheduledDates,
            spillover: tailDates,
          }}
          modifiersClassNames={{
            scheduled:
              "[&_button]:bg-primary/10 [&_button]:text-foreground",
            spillover:
              "[&_button]:bg-primary/5 [&_button]:ring-1 [&_button]:ring-primary/20",
          }}
          className={cn(
            "w-full min-w-0 touch-manipulation p-2 sm:p-3",
            "[--cell-size:calc((100%-0.5rem)/7)]",
            "max-[380px]:[--cell-size:2.35rem]",
            "sm:[--cell-size:2.75rem]",
          )}
          classNames={{
            root: "w-full min-w-0",
            months: "w-full",
            month: "w-full gap-2 sm:gap-3",
            month_grid: "w-full",
            weekdays: "w-full",
            week: "mt-1 w-full",
            day: "min-w-0 flex-1",
            // Custom month bar above — hide built-in caption/nav to avoid duplicates.
            nav: "hidden",
            month_caption: "hidden",
            caption_label: "hidden",
          }}
          components={{
            DayButton: (props) => (
              <ScheduleDayButton
                {...props}
                shiftPlan={shiftPlan}
                today={today}
                activeOvernightAnchors={activeOvernightAnchors}
                onDayClick={handleDayClick}
              />
            ),
          }}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-4 sm:px-4">
        {isTailFocus && focusedShift && !shiftPlan[focusedDate] ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/80 px-3 py-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
              <Moon className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {formatShortDate(focusedDate)} selected
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Morning here is still covered by the overnight shift from{" "}
                  {formatShortDate(focusedShift.anchorDate)} (
                  {formatShiftDateTime(focusedShift.viewStartsAt, timeZone)}
                  {" → "}
                  {formatShiftDateTime(focusedShift.viewEndsAt, timeZone)}
                  ). You can edit that shift, or start a new shift on this day.
                </p>
              </div>
            </div>
            <AppButton
              type="button"
              className="h-11 w-full rounded-xl"
              onClick={startShiftOnFocusedDay}
            >
              Start shift on {formatShortDate(focusedDate)}
            </AppButton>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              className="h-11 w-full rounded-xl"
              onClick={() => focusDate(focusedShift.anchorDate)}
            >
              Edit {formatShortDate(focusedShift.anchorDate)} overnight instead
            </AppButton>
          </div>
        ) : shiftPlan[focusedDate] ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {formatShortDate(focusedDate)}
              </p>
              {focusedOvernight ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <Moon className="size-3" />
                  Ends next day
                </span>
              ) : null}
              {isActivePastOvernight ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  In progress now
                </span>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Start time
                </span>
                <AmPmTimeSelect
                  aria-label="Start time"
                  value={focusedEntry.startTime}
                  onChange={(nextStart) => {
                    updateFocusedEntry({
                      startTime: nextStart || DEFAULT_SHIFT_START_TIME,
                    });
                  }}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  End time
                  {focusedOvernight ? (
                    <span className="ml-1 font-normal text-indigo-600 dark:text-indigo-400">
                      (next day)
                    </span>
                  ) : null}
                </span>
                <AmPmTimeSelect
                  aria-label="End time"
                  value={focusedEntry.endTime}
                  onChange={(nextEnd) => {
                    updateFocusedEntry({
                      endTime: nextEnd || DEFAULT_SHIFT_END_TIME,
                    });
                  }}
                />
              </label>
            </div>

            {focusedWindow ? (
              <div className="mt-4 space-y-1 rounded-xl border border-border/50 bg-background px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Shift window
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatShiftDateTime(focusedWindow.shiftStartsAt, timeZone)}
                  {" → "}
                  {formatShiftDateTime(focusedWindow.shiftEndsAt, timeZone)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number.isInteger(durationHoursForEntry(focusedEntry))
                    ? `${durationHoursForEntry(focusedEntry)}h`
                    : `${durationHoursForEntry(focusedEntry).toFixed(1)}h`}
                  {focusedOvernight
                    ? ` · ends ${formatShortDate(addDaysToDateInput(focusedDate, 1))}`
                    : " · same day"}
                </p>
              </div>
            ) : null}

            {upcomingDates.length > 1 ? (
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-11 w-full rounded-xl"
                onClick={applyHoursToAll}
              >
                Apply these hours to all scheduled days
              </AppButton>
            ) : null}

            <AppButton
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-11 w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={removeFocusedDay}
            >
              <Trash2 className="size-4" />
              Remove this day from schedule
            </AppButton>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {formatShortDate(focusedDate)} has no shift yet. Any future date
              can be selected and edited anytime.
            </p>
            <AppButton
              type="button"
              className="h-11 w-full rounded-xl"
              onClick={startShiftOnFocusedDay}
            >
              Start shift on {formatShortDate(focusedDate)}
            </AppButton>
          </div>
        )}
      </div>

      {upcomingDates.length > 0 ? (
        <ul className="space-y-1.5 rounded-2xl border border-border/60 bg-background px-3 py-3 sm:px-4">
          {upcomingDates.map((date) => {
            const entry = shiftPlan[date];
            const window = shiftPlanDayToWindow(date, entry, timeZone);
            const isFocused = date === focusedDate;
            const overnight = isOvernightShift(entry);
            const dayLabel = formatShiftPlanDayLabel(date, shiftPlan);

            return (
              <li key={date}>
                <button
                  type="button"
                  onClick={() => focusDate(date)}
                  className={cn(
                    "flex min-h-11 w-full flex-col gap-0.5 rounded-lg px-2 py-2.5 text-left text-sm transition sm:flex-row sm:items-center sm:justify-between",
                    isFocused
                      ? "bg-primary/10 font-semibold text-primary"
                      : "hover:bg-muted/60 active:bg-muted/80",
                  )}
                >
                  <span>{formatShortDate(date)}</span>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {overnight ? (
                      <>
                        <Moon className="mr-1 inline size-3" />
                        {formatShiftDateTime(window.shiftStartsAt, timeZone)}
                        {" → "}
                        {formatShiftDateTime(window.shiftEndsAt, timeZone)}
                      </>
                    ) : (
                      <>
                        {dayLabel} ·{" "}
                        {formatShiftDateTime(
                          window.shiftStartsAt,
                          timeZone,
                        ).split(", ")[1] ?? ""}
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Start and end times can be changed independently (AM/PM). If end is
        earlier than or equal to start, the shift ends the next day. Light
        morning marks are overnight spillover — you can still select those days
        and start a new shift there.
      </p>
    </div>
  );
}
