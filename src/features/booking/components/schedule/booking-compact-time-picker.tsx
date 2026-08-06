"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import {
  buildCompactHourGroups,
  findHourKeyForValue,
  formatCompactEndTime,
  formatCompactStartTime,
  formatDurationSummary,
  minutesForHourGroup,
  slotToIso,
} from "../../lib/compact-time-picker-utils";
import { bookingCustomerTheme as customerTheme } from "../../lib/booking-customer-theme";
import {
  formatScheduleDate,
  isoToDatetimeLocal,
} from "../../lib/schedule-utils";
import type { BookingTimeSlotOption } from "./booking-form-sheet";

interface BookingCompactTimePickerProps {
  date: string;
  timeZone: string;
  durationMinutes: number;
  slotOptions: BookingTimeSlotOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  loading?: boolean;
  hint?: string | null;
  disabled?: boolean;
  emptyMessage?: string;
  /** @deprecated Kept for callers; minute tap always commits the time. */
  instantSelect?: boolean;
  roomPreview?: string | null;
  variant?: "admin" | "customer";
}

const adminTimeTheme = {
  label:
    "block text-xs font-semibold uppercase tracking-wider text-muted-foreground",
  emptyState:
    "rounded-2xl border border-border/40 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground",
} as const;

function TimeSelect({
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
  children,
  className,
  accent,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-label": string;
  children: React.ReactNode;
  className?: string;
  accent?: "admin" | "customer";
}) {
  const filled = Boolean(value);

  return (
    <select
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-12 min-w-0 flex-1 appearance-none rounded-xl border bg-background px-3 text-sm font-semibold tabular-nums shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2",
        accent === "customer" && "h-[3.25rem] text-[15px]",
        filled
          ? accent === "customer"
            ? "border-[#8A6A3A] font-semibold text-stone-900 focus-visible:ring-[#8A6A3A]/30"
            : "border-primary text-foreground focus-visible:ring-ring/30"
          : "border-border/60 text-muted-foreground focus-visible:ring-ring/30",
        accent === "customer" && filled && "bg-[#8A6A3A]/5",
        className,
      )}
    >
      {children}
    </select>
  );
}

export function BookingCompactTimePicker({
  date,
  timeZone,
  durationMinutes,
  slotOptions,
  selectedValue,
  onSelect,
  loading = false,
  hint = null,
  disabled = false,
  emptyMessage = "No open slots available.",
  roomPreview = null,
  variant = "admin",
}: BookingCompactTimePickerProps) {
  const theme = variant === "customer" ? customerTheme : adminTimeTheme;
  const hourGroups = useMemo(
    () => buildCompactHourGroups(slotOptions, timeZone, date),
    [slotOptions, timeZone, date],
  );

  const [hourKey, setHourKey] = useState("");

  useEffect(() => {
    if (!selectedValue) return;
    const key = findHourKeyForValue(slotOptions, selectedValue, timeZone, date);
    if (key) setHourKey(key);
  }, [selectedValue, slotOptions, timeZone, date]);

  useEffect(() => {
    if (!selectedValue && hourKey) {
      const stillValid = hourGroups.some((group) => group.key === hourKey);
      if (!stillValid) setHourKey("");
    }
  }, [hourGroups, hourKey, selectedValue]);

  const activeHour = hourGroups.find((group) => group.key === hourKey);
  const minuteOptions = useMemo(
    () => minutesForHourGroup(activeHour, date, timeZone),
    [activeHour, date, timeZone],
  );

  const selectedIso = selectedValue ? slotToIso(date, selectedValue) : "";
  const selectedMinute = selectedIso
    ? isoToDatetimeLocalSlice(selectedIso, timeZone).minute
    : "";

  const endPreview = selectedIso
    ? formatCompactEndTime(selectedIso, durationMinutes, timeZone)
    : null;
  const startPreview = selectedIso
    ? formatCompactStartTime(selectedIso, timeZone, date)
    : null;
  const activeRoom =
    roomPreview ??
    (selectedIso
      ? minuteOptions.find((option) => option.minute === selectedMinute)
          ?.suggestedRoomName ??
        slotOptions.find((slot) => slotToIso(date, slot.value) === selectedIso)
          ?.suggestedRoomName
      : null) ??
    null;

  const handleHourChange = (nextHourKey: string) => {
    setHourKey(nextHourKey);

    if (!nextHourKey) {
      onSelect("");
      return;
    }

    const group = hourGroups.find((item) => item.key === nextHourKey);
    const minutes = minutesForHourGroup(group, date, timeZone);

    // On-the-hour (:00) — or a single available minute — confirms immediately.
    const autoPick =
      minutes.find((option) => option.minute === "00") ??
      (minutes.length === 1 ? minutes[0] : undefined);

    onSelect(autoPick?.value ?? "");
  };

  const handleMinuteChange = (minute: string) => {
    if (!minute || !hourKey) {
      onSelect("");
      return;
    }

    const option = minuteOptions.find((item) => item.minute === minute);
    if (option) {
      onSelect(option.value);
      return;
    }

    onSelect("");
  };

  if (disabled) {
    return (
      <section>
        <p className={cn(theme.label, "mb-2 px-0.5")}>
          Time · {formatDurationSummary(durationMinutes)}
        </p>
        <div className={cn(theme.emptyState, "py-4")}>
          <p>{hint ?? emptyMessage}</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section>
        <p className={cn(theme.label, "mb-2 px-0.5")}>
          Time · {formatDurationSummary(durationMinutes)}
        </p>
        <div className={cn(theme.emptyState, "py-4")}>Loading times…</div>
      </section>
    );
  }

  if (slotOptions.length === 0) {
    return (
      <section>
        <p className={cn(theme.label, "mb-2 px-0.5")}>
          Time · {formatDurationSummary(durationMinutes)}
        </p>
        <div
          className={cn(
            theme.emptyState,
            "border-amber-200 bg-amber-50 py-4 text-amber-900",
          )}
        >
          <p>{hint ?? emptyMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3.5">
      <p className={cn(theme.label, "px-0.5")}>
        Time · {formatDurationSummary(durationMinutes)}
      </p>

      <div
        className={cn(
          "rounded-2xl border border-border/40 bg-card px-4 py-4 shadow-soft",
          variant === "customer" && "border-stone-200/80 px-4 py-4.5",
        )}
      >
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "text-xs font-medium text-muted-foreground",
              variant === "customer" && "font-normal text-stone-500",
            )}
          >
            Service start
          </p>
          <p
            className={cn(
              "text-[11px] tabular-nums text-muted-foreground",
              variant === "customer" && "font-normal text-stone-500",
            )}
          >
            {formatScheduleDate(`${date}T12:00:00`)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <TimeSelect
            aria-label="Hour"
            value={hourKey}
            onChange={handleHourChange}
            accent={variant}
          >
            <option value="">Hour</option>
            {hourGroups.map((group) => (
              <option key={group.key} value={group.key}>
                {group.hourLabel}
              </option>
            ))}
          </TimeSelect>
          <span
            className={cn(
              "text-lg font-semibold text-muted-foreground",
              variant === "customer" && "text-stone-400",
            )}
          >
            :
          </span>
          <TimeSelect
            aria-label="Minute"
            value={selectedMinute}
            onChange={handleMinuteChange}
            disabled={!hourKey}
            accent={variant}
            className="max-w-[6.5rem]"
          >
            <option value="">{hourKey ? "Min" : "—"}</option>
            {minuteOptions.map((option) => (
              <option key={option.value} value={option.minute}>
                {option.minute}
              </option>
            ))}
          </TimeSelect>
        </div>

        <div
          className={cn(
            "mt-4 rounded-xl px-4 py-3.5 text-center transition",
            selectedIso && endPreview
              ? variant === "customer"
                ? "bg-[#8A6A3A]/10 ring-1 ring-[#8A6A3A]/20"
                : "bg-primary/10"
              : "bg-muted/40",
          )}
        >
          {selectedIso && startPreview && endPreview ? (
            <>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums tracking-tight",
                  variant === "customer"
                    ? "text-xl font-bold text-stone-900"
                    : "text-foreground",
                )}
              >
                {startPreview} – {endPreview}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs text-muted-foreground",
                  variant === "customer" &&
                    "font-normal leading-relaxed text-stone-500",
                )}
              >
                {formatScheduleDate(selectedIso)} ·{" "}
                {formatDurationSummary(durationMinutes)}
                {activeRoom ? ` · ${activeRoom}` : ""}
              </p>
            </>
          ) : (
            <p
              className={cn(
                "text-sm text-muted-foreground",
                variant === "customer" &&
                  "font-normal leading-relaxed text-stone-500",
              )}
            >
              {hourKey
                ? "Select a minute (or keep :00)"
                : "Select hour — on the hour confirms automatically"}
            </p>
          )}
        </div>
      </div>

      {hint ? (
        <p
          className={cn(
            "px-1 text-xs text-muted-foreground",
            variant === "customer" &&
              "font-normal leading-relaxed text-stone-500",
          )}
        >
          {hint}
        </p>
      ) : null}
    </section>
  );
}

function isoToDatetimeLocalSlice(iso: string, timeZone: string) {
  const local = isoToDatetimeLocal(iso, timeZone);
  return {
    minute: local.slice(14, 16),
  };
}
