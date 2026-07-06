"use client";

import { useMemo, useState } from "react";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  datetimeLocalToIso,
  formatShiftDateTime,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";

import {
  applyWorkingToday,
  isStaffWorkingOnDate,
} from "../utils/day-schedule";
import {
  buildShiftWindow,
  compactTimeLabel,
  DEFAULT_SHIFT_END_TIME,
  DEFAULT_SHIFT_START_TIME,
  enumerateShiftDates,
  extractClockTime,
  formatDateInput,
  formatShiftDayLabel,
  isDateWorking,
  parseDateInput,
} from "../utils/shift-calendar";

interface StaffShiftCalendarProps {
  timeZone: string;
  shiftStartsAt: string;
  shiftEndsAt: string;
  daySchedule: Record<string, boolean>;
  workingToday: boolean;
  status: "active" | "inactive" | "on_leave";
  localNow: string;
  onShiftChange: (shiftStartsAt: string, shiftEndsAt: string) => void;
  onDayScheduleChange: (
    daySchedule: Record<string, boolean>,
    workingToday: boolean,
  ) => void;
}

function ScheduleDayButton({
  scheduledDates,
  daySchedule,
  shiftStartsAt,
  shiftEndsAt,
  ...props
}: React.ComponentProps<typeof CalendarDayButton> & {
  scheduledDates: Set<string>;
  daySchedule: Record<string, boolean>;
  shiftStartsAt: string;
  shiftEndsAt: string;
}) {
  const dateKey = formatDateInput(props.day.date);
  const scheduled =
    scheduledDates.has(dateKey) && isDateWorking(dateKey, daySchedule);
  const dayOff = scheduledDates.has(dateKey) && !isDateWorking(dateKey, daySchedule);
  const label = formatShiftDayLabel(dateKey, shiftStartsAt, shiftEndsAt);

  return (
    <CalendarDayButton {...props}>
      <span>{props.day.date.getDate()}</span>
      {scheduled && label ? (
        <span className="text-[9px] font-semibold leading-none text-primary">
          {label}
        </span>
      ) : dayOff ? (
        <span className="text-[9px] font-semibold leading-none text-muted-foreground">
          off
        </span>
      ) : scheduled ? (
        <span className="size-1 rounded-full bg-primary" />
      ) : null}
    </CalendarDayButton>
  );
}

export function StaffShiftCalendar({
  timeZone,
  shiftStartsAt,
  shiftEndsAt,
  daySchedule,
  workingToday,
  status,
  localNow,
  onShiftChange,
  onDayScheduleChange,
}: StaffShiftCalendarProps) {
  const today = todayDateInZone(timeZone);
  const [selectedDate, setSelectedDate] = useState(() =>
    shiftStartsAt ? shiftStartsAt.slice(0, 10) : today,
  );
  const [visibleMonth, setVisibleMonth] = useState(() =>
    parseDateInput(shiftStartsAt ? shiftStartsAt.slice(0, 10) : today),
  );

  const scheduledDates = useMemo(
    () => new Set(enumerateShiftDates(shiftStartsAt, shiftEndsAt)),
    [shiftStartsAt, shiftEndsAt],
  );

  const startTime = extractClockTime(shiftStartsAt);
  const endTime = extractClockTime(shiftEndsAt);
  const selectedWorking = isStaffWorkingOnDate(
    status,
    daySchedule,
    selectedDate,
  );

  const minSelectableDate = parseDateInput(today);

  const applyTimes = (nextStartTime: string, nextEndTime: string) => {
    const next = buildShiftWindow(selectedDate, nextStartTime, nextEndTime);
    onShiftChange(next.shiftStartsAt, next.shiftEndsAt);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateKey = formatDateInput(date);
    if (dateKey < today) return;

    setSelectedDate(dateKey);
    setVisibleMonth(date);

    const nextStartTime =
      dateKey === shiftStartsAt.slice(0, 10)
        ? extractClockTime(shiftStartsAt)
        : DEFAULT_SHIFT_START_TIME;
    const nextEndTime =
      dateKey === shiftEndsAt.slice(0, 10)
        ? extractClockTime(shiftEndsAt)
        : DEFAULT_SHIFT_END_TIME;

    applyTimes(nextStartTime, nextEndTime);
  };

  const handleWorkingToggle = (working: boolean) => {
    if (selectedDate === today) {
      onDayScheduleChange(
        applyWorkingToday(daySchedule, today, working),
        working,
      );
      return;
    }

    const next = { ...daySchedule };
    if (working) {
      delete next[selectedDate];
    } else {
      next[selectedDate] = false;
    }
    onDayScheduleChange(next, workingToday);
  };

  const minStartTime =
    selectedDate === today ? localNow.slice(11, 16) : undefined;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
        <Calendar
          mode="single"
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          selected={parseDateInput(selectedDate)}
          onSelect={handleDateSelect}
          disabled={{ before: minSelectableDate }}
          modifiers={{
            scheduled: [...scheduledDates]
              .filter((date) => isDateWorking(date, daySchedule))
              .map((date) => parseDateInput(date)),
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
              <ScheduleDayButton
                {...props}
                scheduledDates={scheduledDates}
                daySchedule={daySchedule}
                shiftStartsAt={shiftStartsAt}
                shiftEndsAt={shiftEndsAt}
              />
            ),
          }}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            {parseDateInput(selectedDate).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={selectedWorking}
              onChange={(event) => handleWorkingToggle(event.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            <span className="text-xs font-medium text-foreground">
              Working this day
            </span>
          </label>
        </div>

        {selectedWorking ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Start
              </span>
              <input
                type="time"
                value={startTime}
                min={minStartTime}
                onChange={(event) => {
                  const nextStart = event.target.value || DEFAULT_SHIFT_START_TIME;
                  const adjustedStart =
                    minStartTime && nextStart < minStartTime
                      ? minStartTime
                      : nextStart;
                  applyTimes(adjustedStart, endTime);
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
                value={endTime}
                onChange={(event) => {
                  const nextEnd = event.target.value || DEFAULT_SHIFT_END_TIME;
                  applyTimes(startTime, nextEnd);
                }}
                className={timeInputClassName}
              />
            </label>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Marked as a day off on the calendar.
          </p>
        )}

        {selectedWorking && shiftStartsAt && shiftEndsAt ? (
          <p className="mt-4 border-t border-border/50 pt-3 text-sm text-foreground">
            <span className="font-medium">
              {formatShiftDateTime(
                datetimeLocalToIso(shiftStartsAt, timeZone),
                timeZone,
              )}
            </span>
            {" → "}
            <span className="font-medium">
              {formatShiftDateTime(
                datetimeLocalToIso(shiftEndsAt, timeZone),
                timeZone,
              )}
            </span>
          </p>
        ) : null}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Tap a date to set hours. Scheduled days show{" "}
        <span className="font-medium text-foreground">
          {compactTimeLabel(DEFAULT_SHIFT_START_TIME)}-
          {compactTimeLabel(DEFAULT_SHIFT_END_TIME)}
        </span>{" "}
        on the calendar.
      </p>
    </div>
  );
}

const timeInputClassName = cn(
  "h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm font-medium shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
);
