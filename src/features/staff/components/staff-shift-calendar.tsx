"use client";

import { useMemo, useState } from "react";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { AppButton } from "@/components/common";
import { cn } from "@/lib/utils";
import {
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
  shiftPlanDayToWindow,
  sortedShiftPlanDates,
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
  ...props
}: React.ComponentProps<typeof CalendarDayButton> & {
  shiftPlan: ShiftPlan;
}) {
  const dateKey = formatDateInput(props.day.date);
  const entry = shiftPlan[dateKey];
  const label = formatShiftPlanDayLabel(dateKey, shiftPlan);

  return (
    <CalendarDayButton {...props}>
      <span>{props.day.date.getDate()}</span>
      {entry && label ? (
        <span className="text-[9px] font-semibold leading-none text-primary">
          {label}
        </span>
      ) : entry ? (
        <span className="size-1 rounded-full bg-primary" />
      ) : null}
    </CalendarDayButton>
  );
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

  const [focusedDate, setFocusedDate] = useState(() => {
    const dates = sortedShiftPlanDates(shiftPlan);
    return dates.find((date) => date >= today) ?? dates[0] ?? today;
  });

  const [visibleMonth, setVisibleMonth] = useState(() =>
    parseDateInput(focusedDate),
  );

  const focusedEntry: DayShiftEntry = shiftPlan[focusedDate] ?? {
    startTime: DEFAULT_SHIFT_START_TIME,
    endTime: DEFAULT_SHIFT_END_TIME,
  };

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
          }}
          modifiersClassNames={{
            scheduled: "[&_button]:bg-primary/10",
          }}
          className="w-full p-3 [--cell-size:--spacing(10)]"
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
              <ScheduleDayButton {...props} shiftPlan={shiftPlan} />
            ),
          }}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
        {shiftPlan[focusedDate] ? (
          <>
            <p className="text-sm font-semibold text-foreground">
              {parseDateInput(focusedDate).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>

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
              <p className="mt-4 border-t border-border/50 pt-3 text-sm text-foreground">
                {formatShiftDateTime(focusedWindow.shiftStartsAt, timeZone)}
                {" → "}
                {formatShiftDateTime(focusedWindow.shiftEndsAt, timeZone)}
              </p>
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

            return (
              <li key={date}>
                <button
                  type="button"
                  onClick={() => {
                    setFocusedDate(date);
                    setVisibleMonth(parseDateInput(date));
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition",
                    isFocused
                      ? "bg-primary/10 font-semibold text-primary"
                      : "hover:bg-muted/60",
                  )}
                >
                  <span>
                    {parseDateInput(date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </span>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {formatShiftDateTime(window.shiftStartsAt, timeZone).split(
                      ", ",
                    )[1] ?? ""}{" "}
                    ({entry.startTime}-{entry.endTime})
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="text-[11px] text-muted-foreground">
        Tap multiple dates to pre-schedule shifts. Each day can share the same
        hours or be edited individually below.
      </p>
    </div>
  );
}

const timeInputClassName = cn(
  "h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm font-medium shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
);
