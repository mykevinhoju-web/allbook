"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import {
  buildStartsAtIso,
  formatAmPmTime,
  formatDurationLabel,
  groupTimeSlotsByHour,
} from "../../lib/schedule-utils";
import type { BookingTimeSlotOption } from "./booking-form-sheet";

interface BookingTimePickerProps {
  date: string;
  durationMinutes: number;
  slotOptions: BookingTimeSlotOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  loading?: boolean;
  hint?: string | null;
  disabled?: boolean;
  emptyMessage?: string;
}

function IosSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export function BookingTimePicker({
  date,
  durationMinutes,
  slotOptions,
  selectedValue,
  onSelect,
  loading = false,
  hint = null,
  disabled = false,
  emptyMessage = "No open slots available.",
}: BookingTimePickerProps) {
  const [expandedHours, setExpandedHours] = useState<Set<string>>(new Set());

  const slotGroups = useMemo(
    () => groupTimeSlotsByHour(date, slotOptions.map((slot) => slot.value)),
    [date, slotOptions],
  );

  useEffect(() => {
    if (slotGroups.length === 0) {
      setExpandedHours(new Set());
      return;
    }

    const selectedHour = slotGroups.find((group) =>
      group.slots.includes(selectedValue),
    )?.hourLabel;
    const first = selectedHour ?? slotGroups[0]?.hourLabel;
    if (first) {
      setExpandedHours(new Set([first]));
    }
  }, [durationMinutes, selectedValue, slotGroups]);

  const toggleHour = (hourLabel: string) => {
    setExpandedHours((current) => {
      const next = new Set(current);
      if (next.has(hourLabel)) {
        next.delete(hourLabel);
      } else {
        next.add(hourLabel);
      }
      return next;
    });
  };

  if (disabled) {
    return (
      <section>
        <IosSectionLabel>
          Pick a time · {formatDurationLabel(durationMinutes)}
        </IosSectionLabel>
        <div className="rounded-2xl border border-border/40 bg-card px-4 py-6 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">{hint ?? emptyMessage}</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section>
        <IosSectionLabel>
          Pick a time · {formatDurationLabel(durationMinutes)}
        </IosSectionLabel>
        <div className="rounded-2xl border border-border/40 bg-card px-4 py-6 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">Loading times…</p>
        </div>
      </section>
    );
  }

  if (slotGroups.length === 0) {
    return (
      <section>
        <IosSectionLabel>
          Pick a time · {formatDurationLabel(durationMinutes)}
        </IosSectionLabel>
        <div className="rounded-2xl border border-border/40 bg-card px-4 py-6 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">{hint ?? emptyMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <IosSectionLabel>
        Pick a time · {formatDurationLabel(durationMinutes)}
      </IosSectionLabel>

      {hint ? (
        <p className="mb-2 px-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}

      <div className="space-y-2">
        {slotGroups.map((group) => {
          const expanded = expandedHours.has(group.hourLabel);
          return (
            <div
              key={group.hourLabel}
              className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-soft"
            >
              <button
                type="button"
                onClick={() => toggleHour(group.hourLabel)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted/40"
              >
                {expanded ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 text-sm font-semibold">
                  {group.hourLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  {group.slots.length} open
                </span>
              </button>

              {expanded ? (
                <div className="border-t border-border/40 bg-muted/25 px-3 py-3">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {group.slots.map((slot) => {
                      const selected = selectedValue === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => onSelect(slot)}
                          className={cn(
                            "rounded-xl py-2.5 text-sm font-medium tabular-nums shadow-sm ring-1 ring-black/5 transition active:scale-[0.97]",
                            selected
                              ? "bg-primary text-primary-foreground ring-primary/20"
                              : "bg-background active:bg-primary active:text-primary-foreground",
                          )}
                        >
                          {formatAmPmTime(buildStartsAtIso(date, slot))}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
