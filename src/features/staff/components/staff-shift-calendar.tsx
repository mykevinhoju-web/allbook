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
  entryFromStartAndDurationHours,
  formatDateInput,
  parseDateInput,
  roundUpClockToHalfHour,
} from "../utils/shift-calendar";
import {
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
  onDayClick,
  ...props
}: React.ComponentProps<typeof CalendarDayButton> & {
  shiftPlan: ShiftPlan;
  today: string;
  onDayClick: (day: Date) => void;
}) {
  const dateKey = formatDateInput(props.day.date);
  const showMarkers = dateKey >= today;
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
  const upcomingDates = useMemo(
    () => sortedShiftPlanDates(shiftPlan).filter((date) => date >= today),
    [shiftPlan, today],
  );
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
    const dates = sortedShiftPlanDates(shiftPlan);
    return dates.find((date) => date >= today) ?? dates[0] ?? today;
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

  const minSelectableDate = parseDateInput(today);
  const canGoPrevMonth =
    visibleMonth.getFullYear() > minSelectableDate.getFullYear() ||
    (visibleMonth.getFullYear() === minSelectableDate.getFullYear() &&
      visibleMonth.getMonth() > minSelectableDate.getMonth());
  const minStartTime =
    focusedDate === today ? localNow.slice(11, 16) : undefined;

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
    if (key < today) return;

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
      remaining.find((date) => date >= today) ?? remaining[0] ?? today;
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
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Quick start
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      focusedDate === today
                        ? {
                            label: "Now",
                            time: roundUpClockToHalfHour(localNow.slice(11, 16)),
                          }
                        : null,
                      { label: "9:00 AM", time: "09:00" },
                      { label: "1:00 PM", time: "13:00" },
                      { label: "2:00 PM", time: "14:00" },
                      { label: "6:00 PM", time: "18:00" },
                    ] as Array<{ label: string; time: string } | null>
                  )
                    .filter(Boolean)
                    .map((preset) => {
                      const item = preset!;
                      const disabled =
                        Boolean(minStartTime) && item.time < minStartTime!;
                      const selected = focusedEntry.startTime === item.time;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            const duration = durationHoursForEntry(focusedEntry);
                            updateFocusedEntry(
                              entryFromStartAndDurationHours(
                                item.time,
                                duration,
                              ),
                            );
                          }}
                          className={cn(
                            "h-9 rounded-full border px-3 text-xs font-semibold transition",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 bg-background hover:bg-muted/60",
                            disabled && "pointer-events-none opacity-40",
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Start time
                </span>
                <input
                  type="time"
                  value={focusedEntry.startTime}
                  min={minStartTime}
                  onChange={(event) => {
                    const nextStart =
                      event.target.value || DEFAULT_SHIFT_START_TIME;
                    const adjustedStart =
                      minStartTime && nextStart < minStartTime
                        ? minStartTime
                        : nextStart;
                    const duration = durationHoursForEntry(focusedEntry);
                    updateFocusedEntry(
                      entryFromStartAndDurationHours(adjustedStart, duration),
                    );
                  }}
                  className={timeInputClassName}
                />
              </label>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Length
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {([8, 12, 24] as const).map((hours) => {
                    const selected =
                      Math.abs(durationHoursForEntry(focusedEntry) - hours) <
                      0.01;
                    return (
                      <button
                        key={hours}
                        type="button"
                        onClick={() =>
                          updateFocusedEntry(
                            entryFromStartAndDurationHours(
                              focusedEntry.startTime,
                              hours,
                            ),
                          )
                        }
                        className={cn(
                          "h-11 rounded-xl border text-sm font-semibold transition",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/60 bg-background hover:bg-muted/60",
                        )}
                      >
                        +{hours}h
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  End time
                  {focusedOvernight ? (
                    <span className="ml-1 font-normal text-indigo-600 dark:text-indigo-400">
                      (next day)
                    </span>
                  ) : null}
                </span>
                <input
                  type="time"
                  value={focusedEntry.endTime}
                  onChange={(event) => {
                    updateFocusedEntry({
                      endTime: event.target.value || DEFAULT_SHIFT_END_TIME,
                    });
                  }}
                  className={timeInputClassName}
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
        Pick any future date, then set start with quick buttons and length
        (+8h / +12h / +24h). Example: 1:00 PM + 24h → next day 1:00 PM. Light
        morning marks are overnight spillover — you can still select those days
        and start a new shift there.
      </p>
    </div>
  );
}

const timeInputClassName = cn(
  "h-11 w-full min-h-11 rounded-xl border border-border/60 bg-background px-3 text-base font-medium shadow-sm sm:text-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
);
