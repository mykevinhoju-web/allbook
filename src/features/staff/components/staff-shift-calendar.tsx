"use client";

import { useMemo, useState } from "react";
import { Moon } from "lucide-react";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
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
  formatDateInput,
  parseDateInput,
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

function ScheduleDayButton({
  shiftPlan,
  onDayFocus,
  ...props
}: React.ComponentProps<typeof CalendarDayButton> & {
  shiftPlan: ShiftPlan;
  onDayFocus?: (day: Date) => void;
}) {
  const dateKey = formatDateInput(props.day.date);
  const entry = shiftPlan[dateKey];
  const label = formatShiftPlanDayLabel(dateKey, shiftPlan);
  const isTail = !entry && Boolean(spilloverAnchorForDate(shiftPlan, dateKey));

  return (
    <CalendarDayButton
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        onDayFocus?.(props.day.date);
      }}
    >
      <span>{props.day.date.getDate()}</span>
      {label ? (
        <span
          className={cn(
            "text-[9px] font-semibold leading-none",
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
  return parseDateInput(date).toLocaleDateString(undefined, {
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
  const scheduledDates = useMemo(
    () => sortedShiftPlanDates(shiftPlan).map((date) => parseDateInput(date)),
    [shiftPlan],
  );
  const tailDates = useMemo(
    () => tailDatesForPlan(shiftPlan).map((date) => parseDateInput(date)),
    [shiftPlan],
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
  const minStartTime =
    focusedDate === today ? localNow.slice(11, 16) : undefined;

  const updateFocusedEntry = (patch: Partial<DayShiftEntry>) => {
    if (!shiftPlan[focusedDate]) return;

    const nextEntry = { ...shiftPlan[focusedDate], ...patch };
    onShiftPlanChange({
      ...shiftPlan,
      [focusedDate]: nextEntry,
    });
  };

  const handleDatesChange = (dates: Date[] | undefined) => {
    const nextKeys = new Set((dates ?? []).map((date) => formatDateInput(date)));
    const prevKeys = new Set(Object.keys(shiftPlan));

    for (const key of [...nextKeys]) {
      const spilloverAnchor = spilloverAnchorForDate(shiftPlan, key);
      if (spilloverAnchor && !prevKeys.has(key)) {
        nextKeys.delete(key);
        setFocusedDate(spilloverAnchor);
        setVisibleMonth(parseDateInput(spilloverAnchor));
      }
    }

    const nextPlan: ShiftPlan = { ...shiftPlan };

    for (const key of nextKeys) {
      if (!prevKeys.has(key)) {
        nextPlan[key] = shiftPlan[focusedDate]
          ? { ...shiftPlan[focusedDate] }
          : {
              startTime: DEFAULT_SHIFT_START_TIME,
              endTime: DEFAULT_SHIFT_END_TIME,
            };
        setFocusedDate(key);
        setVisibleMonth(parseDateInput(key));
      }
    }

    for (const key of prevKeys) {
      if (!nextKeys.has(key)) {
        delete nextPlan[key];
      }
    }

    onShiftPlanChange(nextPlan);
  };

  const handleDayFocus = (day: Date) => {
    const key = formatDateInput(day);
    setFocusedDate(key);
  };

  const applyHoursToAll = () => {
    const nextPlan: ShiftPlan = {};
    for (const date of Object.keys(shiftPlan)) {
      nextPlan[date] = { ...focusedEntry };
    }
    onShiftPlanChange(nextPlan);
  };

  const focusedWindow = shiftPlan[focusedDate]
    ? shiftPlanDayToWindow(focusedDate, shiftPlan[focusedDate], timeZone)
    : null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
        <Calendar
          mode="multiple"
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          selected={scheduledDates}
          onSelect={handleDatesChange}
          disabled={{ before: minSelectableDate }}
          modifiers={{
            scheduled: scheduledDates,
            spillover: tailDates,
          }}
          modifiersClassNames={{
            scheduled: "[&_button]:bg-primary/10",
            spillover: "[&_button]:bg-primary/5 [&_button]:ring-1 [&_button]:ring-primary/20",
          }}
          className="w-full p-3 [--cell-size:--spacing(10)] sm:[--cell-size:--spacing(11)]"
          classNames={{
            month: "w-full gap-3",
            month_grid: "w-full",
            weekdays: "w-full",
            week: "w-full mt-1",
            day: "flex-1",
            caption_label: "text-base font-semibold",
          }}
          components={{
            DayButton: (props) => (
              <ScheduleDayButton
                {...props}
                shiftPlan={shiftPlan}
                onDayFocus={handleDayFocus}
              />
            ),
          }}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
        {isTailFocus && focusedShift ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/80 px-3 py-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
              <Moon className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {formatShortDate(focusedDate)} morning
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This is the end of the overnight shift starting{" "}
                  {formatShortDate(focusedShift.anchorDate)}. Edit times on
                  the start day.
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground">
              {formatShiftDateTime(focusedShift.viewStartsAt, timeZone)}
              {" → "}
              {formatShiftDateTime(focusedShift.viewEndsAt, timeZone)}
            </p>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
              onClick={() => {
                setFocusedDate(focusedShift.anchorDate);
                setVisibleMonth(parseDateInput(focusedShift.anchorDate));
              }}
            >
              Edit {formatShortDate(focusedShift.anchorDate)} shift
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

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Start
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
                    updateFocusedEntry({ startTime: adjustedStart });
                  }}
                  className={timeInputClassName}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  End
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

            {Object.keys(shiftPlan).length > 1 ? (
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full rounded-xl"
                onClick={applyHoursToAll}
              >
                Apply these hours to all scheduled days
              </AppButton>
            ) : null}

            {focusedWindow ? (
              <div className="mt-4 space-y-1 border-t border-border/50 pt-3">
                <p className="text-sm font-medium text-foreground">
                  {formatShiftDateTime(focusedWindow.shiftStartsAt, timeZone)}
                  {" → "}
                  {formatShiftDateTime(focusedWindow.shiftEndsAt, timeZone)}
                </p>
                {focusedOvernight ? (
                  <p className="text-xs text-muted-foreground">
                    Ends {formatShortDate(addDaysToDateInput(focusedDate, 1))}{" "}
                    at {focusedEntry.endTime}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tap dates on the calendar to add them to the schedule.
          </p>
        )}
      </div>

      {scheduledDates.length > 0 ? (
        <ul className="space-y-1.5 rounded-2xl border border-border/60 bg-background px-4 py-3">
          {sortedShiftPlanDates(shiftPlan).map((date) => {
            const entry = shiftPlan[date];
            const window = shiftPlanDayToWindow(date, entry, timeZone);
            const isFocused = date === focusedDate;
            const overnight = isOvernightShift(entry);
            const dayLabel = formatShiftPlanDayLabel(date, shiftPlan);

            return (
              <li key={date}>
                <button
                  type="button"
                  onClick={() => {
                    setFocusedDate(date);
                    setVisibleMonth(parseDateInput(date));
                  }}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left text-sm transition sm:flex-row sm:items-center sm:justify-between",
                    isFocused
                      ? "bg-primary/10 font-semibold text-primary"
                      : "hover:bg-muted/60",
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
        Select the <strong>shift start day</strong> only. For overnight shifts
        (e.g. 9pm–9am), pick the evening date and set End earlier than Start —
        the next morning is filled in automatically and shown with a light
        highlight.
      </p>
    </div>
  );
}

const timeInputClassName = cn(
  "h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm font-medium shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
);
