"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import {
  formatCompactEndTime,
  formatCompactStartTime,
  formatDurationSummary,
} from "../../lib/compact-time-picker-utils";
import {
  availableHours,
  availableMinutes,
  availablePeriods,
  buildBookableDateOptions,
  buildSlotClocks,
  daysForMonth,
  findSlotIso,
  padMinute,
  uniqueMonths,
  type DayPeriod,
} from "../../lib/customer-datetime-picker-utils";
import { bookingCustomerTheme as theme } from "../../lib/booking-customer-theme";
import {
  formatScheduleDate,
  todayDateInZone,
} from "../../lib/schedule-utils";
import type { BookingTimeSlotOption } from "../schedule/booking-form-sheet";

interface BookingCustomerDateTimePickerProps {
  date: string;
  onDateChange: (date: string) => void;
  timeZone: string;
  durationMinutes: number;
  slotOptions: BookingTimeSlotOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  loading?: boolean;
  hint?: string | null;
  emptyMessage?: string;
  roomPreview?: string | null;
}

function FieldSelect({
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
  children,
  className,
  filled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-label": string;
  children: React.ReactNode;
  className?: string;
  filled?: boolean;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-[3.25rem] min-w-0 flex-1 appearance-none rounded-xl border bg-background px-3 text-[15px] font-semibold tabular-nums shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6A3A]/30",
        filled
          ? "border-[#8A6A3A] bg-[#8A6A3A]/5 text-stone-900"
          : "border-border/60 text-muted-foreground",
        disabled && "opacity-50",
        className,
      )}
    >
      {children}
    </select>
  );
}

export function BookingCustomerDateTimePicker({
  date,
  onDateChange,
  timeZone,
  durationMinutes,
  slotOptions,
  selectedValue,
  onSelect,
  loading = false,
  hint = null,
  emptyMessage = "No open slots available.",
  roomPreview = null,
}: BookingCustomerDateTimePickerProps) {
  const today = todayDateInZone(timeZone);
  const dateOptions = useMemo(
    () => buildBookableDateOptions(today),
    [today],
  );
  const months = useMemo(() => uniqueMonths(dateOptions), [dateOptions]);

  const [monthKey, setMonthKey] = useState(() => date.slice(0, 7));
  const [period, setPeriod] = useState<DayPeriod | "">("");
  const [hour12, setHour12] = useState<number | "">("");
  const [minute, setMinute] = useState<number | "">("");

  const dayOptions = useMemo(
    () => daysForMonth(dateOptions, monthKey),
    [dateOptions, monthKey],
  );

  const clocks = useMemo(
    () => buildSlotClocks(slotOptions, date, timeZone),
    [slotOptions, date, timeZone],
  );

  const periods = useMemo(() => availablePeriods(clocks), [clocks]);
  const hours = useMemo(
    () => availableHours(clocks, period),
    [clocks, period],
  );
  const minutes = useMemo(
    () => availableMinutes(clocks, period, hour12),
    [clocks, period, hour12],
  );

  useEffect(() => {
    if (!dateOptions.some((option) => option.value === date)) {
      const fallback = dateOptions[0]?.value;
      if (fallback && fallback !== date) onDateChange(fallback);
      return;
    }
    setMonthKey(date.slice(0, 7));
    // Intentionally omit onDateChange — parent passes an inline handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, dateOptions]);

  useEffect(() => {
    if (!selectedValue) {
      setPeriod("");
      setHour12("");
      setMinute("");
      return;
    }

    const match = clocks.find((clock) => clock.iso === selectedValue);
    if (!match) return;
    setPeriod(match.period);
    setHour12(match.hour12);
    setMinute(match.minute);
  }, [selectedValue, clocks]);

  useEffect(() => {
    if (!selectedValue) return;
    const stillValid = clocks.some((clock) => clock.iso === selectedValue);
    if (!stillValid) onSelect("");
    // Intentionally omit onSelect — parent passes an inline handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clocks, selectedValue]);

  const commitTime = (
    nextPeriod: DayPeriod | "",
    nextHour: number | "",
    nextMinute: number | "",
  ) => {
    setPeriod(nextPeriod);
    setHour12(nextHour);
    setMinute(nextMinute);
    onSelect(findSlotIso(clocks, nextPeriod, nextHour, nextMinute));
  };

  const handleMonthChange = (nextMonth: string) => {
    setMonthKey(nextMonth);
    const firstDay = daysForMonth(dateOptions, nextMonth)[0];
    if (firstDay && firstDay.value !== date) {
      onSelect("");
      onDateChange(firstDay.value);
    }
  };

  const handleDayChange = (nextDate: string) => {
    if (nextDate === date) return;
    onSelect("");
    onDateChange(nextDate);
  };

  const handlePeriodChange = (next: DayPeriod) => {
    const nextHours = availableHours(clocks, next);
    const nextHour =
      hour12 !== "" && nextHours.includes(hour12) ? hour12 : nextHours[0] ?? "";
    const nextMinutes = availableMinutes(clocks, next, nextHour);
    const nextMinute =
      minute !== "" && nextMinutes.includes(minute)
        ? minute
        : nextMinutes[0] ?? "";
    commitTime(next, nextHour, nextMinute);
  };

  const handleHourChange = (raw: string) => {
    if (!raw) {
      commitTime(period, "", "");
      return;
    }
    const nextHour = Number(raw);
    const nextMinutes = availableMinutes(clocks, period, nextHour);
    const nextMinute =
      minute !== "" && nextMinutes.includes(minute)
        ? minute
        : nextMinutes[0] ?? "";
    commitTime(period, nextHour, nextMinute);
  };

  const handleMinuteChange = (raw: string) => {
    if (!raw) {
      commitTime(period, hour12, "");
      return;
    }
    commitTime(period, hour12, Number(raw));
  };

  const endPreview = selectedValue
    ? formatCompactEndTime(selectedValue, durationMinutes, timeZone)
    : null;
  const startPreview = selectedValue
    ? formatCompactStartTime(selectedValue, timeZone, date)
    : null;
  const activeRoom =
    roomPreview ??
    (selectedValue
      ? slotOptions.find((slot) => slot.value === selectedValue)
          ?.suggestedRoomName
      : null) ??
    null;

  if (loading) {
    return (
      <section>
        <p className={cn(theme.label, "mb-2 px-0.5")}>
          Date & time · {formatDurationSummary(durationMinutes)}
        </p>
        <div className={cn(theme.emptyState, "py-4")}>Loading times…</div>
      </section>
    );
  }

  return (
    <section className="space-y-3.5">
      <p className={cn(theme.label, "px-0.5")}>
        Date & time · {formatDurationSummary(durationMinutes)}
      </p>

      <div className="rounded-2xl border border-stone-200/80 bg-card px-4 py-4.5 shadow-soft">
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-medium text-stone-500">Date</p>
            <div className="flex gap-2">
              <FieldSelect
                aria-label="Month"
                value={monthKey}
                onChange={handleMonthChange}
                filled={Boolean(monthKey)}
              >
                {months.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))}
              </FieldSelect>
              <FieldSelect
                aria-label="Day"
                value={date}
                onChange={handleDayChange}
                filled={Boolean(date)}
              >
                {dayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.dayLabel}
                  </option>
                ))}
              </FieldSelect>
            </div>
          </div>

          {slotOptions.length === 0 ? (
            <div
              className={cn(
                theme.emptyState,
                "border-amber-200 bg-amber-50 py-4 text-amber-900",
              )}
            >
              <p>{hint ?? emptyMessage}</p>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs font-medium text-stone-500">
                Start time
              </p>
              <div className="mb-2.5 grid grid-cols-2 gap-2">
                {(["AM", "PM"] as const).map((option) => {
                  const enabled = periods.includes(option);
                  const selected = period === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={!enabled}
                      onClick={() => handlePeriodChange(option)}
                      className={cn(
                        "h-[3.25rem] rounded-xl border text-[15px] font-semibold transition",
                        selected
                          ? "border-[#8A6A3A] bg-[#8A6A3A]/10 text-stone-900"
                          : "border-border/60 bg-background text-stone-500",
                        !enabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <FieldSelect
                  aria-label="Hour"
                  value={hour12 === "" ? "" : String(hour12)}
                  onChange={handleHourChange}
                  disabled={!period}
                  filled={hour12 !== ""}
                >
                  <option value="">{period ? "Hour" : "—"}</option>
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </FieldSelect>
                <span className="text-lg font-semibold text-stone-400">:</span>
                <FieldSelect
                  aria-label="Minute"
                  value={minute === "" ? "" : String(minute)}
                  onChange={handleMinuteChange}
                  disabled={!period || hour12 === ""}
                  filled={minute !== ""}
                  className="max-w-[6.5rem]"
                >
                  <option value="">
                    {period && hour12 !== "" ? "Min" : "—"}
                  </option>
                  {minutes.map((option) => (
                    <option key={option} value={option}>
                      {padMinute(option)}
                    </option>
                  ))}
                </FieldSelect>
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "mt-4 rounded-xl px-4 py-3.5 text-center transition",
            selectedValue && endPreview
              ? "bg-[#8A6A3A]/10 ring-1 ring-[#8A6A3A]/20"
              : "bg-muted/40",
          )}
        >
          {selectedValue && startPreview && endPreview ? (
            <>
              <p className="text-xl font-bold tabular-nums tracking-tight text-stone-900">
                {startPreview} – {endPreview}
              </p>
              <p className="mt-1 text-xs font-normal leading-relaxed text-stone-500">
                {formatScheduleDate(selectedValue)} ·{" "}
                {formatDurationSummary(durationMinutes)}
                {activeRoom ? ` · ${activeRoom}` : ""}
              </p>
            </>
          ) : (
            <p className="text-sm font-normal leading-relaxed text-stone-500">
              {slotOptions.length === 0
                ? "Pick another date"
                : period
                  ? "Choose hour and minute"
                  : "Pick AM or PM, then the time"}
            </p>
          )}
        </div>
      </div>

      {hint && slotOptions.length > 0 ? (
        <p className={cn(theme.helperText, "px-1")}>{hint}</p>
      ) : null}
    </section>
  );
}
