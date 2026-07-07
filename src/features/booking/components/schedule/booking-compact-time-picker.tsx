"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";

import { AppButton } from "@/components/common";
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
import { formatAmPmTime, isoToDatetimeLocal } from "../../lib/schedule-utils";
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
  /** Pick time immediately on minute select (staff quick-add). */
  instantSelect?: boolean;
  roomPreview?: string | null;
  variant?: "admin" | "customer";
}

function IosSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function SelectField({
  value,
  onChange,
  disabled,
  children,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-11 min-w-0 flex-1 appearance-none rounded-xl border border-border/60 bg-background px-3 text-sm font-semibold tabular-nums shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
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
  instantSelect = false,
  roomPreview = null,
  variant = "admin",
}: BookingCompactTimePickerProps) {
  const [showMoreTimes, setShowMoreTimes] = useState(false);
  const hourGroups = useMemo(
    () => buildCompactHourGroups(slotOptions, timeZone, date),
    [slotOptions, timeZone, date],
  );

  const [hourKey, setHourKey] = useState<string>("");

  useEffect(() => {
    if (!selectedValue) return;
    const key = findHourKeyForValue(slotOptions, selectedValue, timeZone, date);
    if (key) setHourKey(key);
  }, [selectedValue, slotOptions, timeZone, date]);

  useEffect(() => {
    if (hourKey || hourGroups.length === 0) return;
    const fromSelection = selectedValue
      ? findHourKeyForValue(slotOptions, selectedValue, timeZone, date)
      : null;
    setHourKey(fromSelection ?? hourGroups[0]?.key ?? "");
  }, [hourGroups, hourKey, selectedValue, slotOptions, timeZone, date]);

  const activeHour = hourGroups.find((group) => group.key === hourKey);
  const minuteOptions = useMemo(
    () => minutesForHourGroup(activeHour, date, timeZone),
    [activeHour, date, timeZone],
  );

  const selectedIso = selectedValue
    ? slotToIso(date, selectedValue)
    : minuteOptions.find((option) => option.value)?.value ?? "";

  const selectedMinute = selectedIso
    ? isoToDatetimeLocalSlice(selectedIso, timeZone).minute
    : "";

  const nextSlot = slotOptions[0];
  const chipSlots = slotOptions.slice(0, 8);

  const endPreview = selectedIso
    ? formatCompactEndTime(selectedIso, durationMinutes, timeZone)
    : null;
  const startPreview = selectedIso
    ? formatCompactStartTime(selectedIso, timeZone, date)
    : null;
  const activeRoom =
    roomPreview ??
    minuteOptions.find((option) => option.minute === selectedMinute)
      ?.suggestedRoomName ??
    slotOptions.find((slot) => slotToIso(date, slot.value) === selectedIso)
      ?.suggestedRoomName ??
    null;

  const handleHourChange = (nextHourKey: string) => {
    setHourKey(nextHourKey);
    if (instantSelect) return;
    const group = hourGroups.find((item) => item.key === nextHourKey);
    const firstMinute = minutesForHourGroup(group, date, timeZone)[0];
    if (firstMinute) {
      onSelect(firstMinute.value);
    } else {
      onSelect("");
    }
  };

  const handleMinuteChange = (minute: string) => {
    const option = minuteOptions.find((item) => item.minute === minute);
    if (option) onSelect(option.value);
  };

  if (disabled) {
    return (
      <section>
        <IosSectionLabel>Time · {formatDurationSummary(durationMinutes)}</IosSectionLabel>
        <div className="rounded-2xl border border-border/40 bg-card px-4 py-6 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">{hint ?? emptyMessage}</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section>
        <IosSectionLabel>Time · {formatDurationSummary(durationMinutes)}</IosSectionLabel>
        <div className="rounded-2xl border border-border/40 bg-card px-4 py-6 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">Loading times…</p>
        </div>
      </section>
    );
  }

  if (slotOptions.length === 0) {
    return (
      <section>
        <IosSectionLabel>Time · {formatDurationSummary(durationMinutes)}</IosSectionLabel>
        <div className="rounded-2xl border border-border/40 bg-card px-4 py-6 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">{hint ?? emptyMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <IosSectionLabel>Time · {formatDurationSummary(durationMinutes)}</IosSectionLabel>

      {nextSlot ? (
        <AppButton
          type="button"
          variant="outline"
          className="h-11 w-full justify-start gap-2 rounded-2xl border-primary/30 bg-primary/5 text-left text-sm font-medium"
          onClick={() => onSelect(slotToIso(date, nextSlot.value))}
        >
          <Zap className="size-4 shrink-0 text-primary" />
          <span className="truncate">
            Next available: {formatAmPmTime(slotToIso(date, nextSlot.value))}
            {nextSlot.suggestedRoomName ? ` · ${nextSlot.suggestedRoomName}` : ""}
          </span>
        </AppButton>
      ) : null}

      {variant === "customer" && !showMoreTimes ? (
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-soft">
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
            {chipSlots.map((slot) => {
              const iso = slotToIso(date, slot.value);
              const selected = selectedIso === iso;
              return (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => onSelect(iso)}
                  className={cn(
                    "rounded-xl px-2 py-2.5 text-sm font-semibold tabular-nums transition",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted",
                  )}
                >
                  {formatAmPmTime(iso)}
                </button>
              );
            })}
          </div>
          {slotOptions.length > chipSlots.length ? (
            <button
              type="button"
              className="w-full border-t border-border/40 py-3 text-sm font-medium text-primary"
              onClick={() => setShowMoreTimes(true)}
            >
              More times
            </button>
          ) : null}
        </div>
      ) : null}

      {variant === "admin" || showMoreTimes ? (
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-soft">
          <div className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Service start</p>
              <div className="flex items-center gap-2">
                <SelectField
                  value={hourKey}
                  onChange={handleHourChange}
                  className="min-w-[8.5rem]"
                >
                  {hourGroups.map((group) => (
                    <option key={group.key} value={group.key}>
                      {group.hourLabel}
                    </option>
                  ))}
                </SelectField>
                <span className="text-lg font-semibold text-muted-foreground">:</span>
                <SelectField
                  value={selectedMinute || minuteOptions[0]?.minute || ""}
                  onChange={handleMinuteChange}
                  className="min-w-[6.5rem]"
                >
                  {minuteOptions.map((option) => (
                    <option key={option.value} value={option.minute}>
                      {option.minute}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-border/40 pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Service end</p>
                <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
                  {endPreview ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Room</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {activeRoom ?? "Auto-assign"}
                </p>
              </div>
            </div>

            {startPreview && endPreview ? (
              <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {startPreview} → {endPreview} ({formatDurationSummary(durationMinutes)})
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {hint ? (
        <p className="px-1 text-xs text-muted-foreground">{hint}</p>
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
