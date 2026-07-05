"use client";

import { cn } from "@/lib/utils";
import { AppButton, toast } from "@/components/common";

import {
  isStaffWorkingOnDate,
  setDayWorking,
} from "../utils/day-schedule";

interface StaffWorkingTodayToggleProps {
  staffId: string;
  staffName: string;
  status: "active" | "inactive" | "on_leave";
  daySchedule: Record<string, boolean>;
  today: string;
  workingToday: boolean;
  onChanged?: () => void;
  compact?: boolean;
}

export function StaffWorkingTodayToggle({
  staffId,
  staffName,
  status,
  daySchedule,
  today,
  workingToday,
  onChanged,
  compact = false,
}: StaffWorkingTodayToggleProps) {
  const disabled = status !== "active";

  const toggle = async () => {
    if (disabled) return;

    const nextSchedule = setDayWorking(daySchedule, today, !workingToday);

    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daySchedule: nextSchedule }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Could not update schedule.");
      }

      toast.success(
        workingToday
          ? `${staffName} marked off today`
          : `${staffName} marked working today`,
      );
      onChanged?.();
    } catch (error) {
      toast.error("Could not update schedule", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  if (disabled) {
    return (
      <span className="text-sm text-muted-foreground">
        {status === "on_leave" ? "On leave" : "Inactive"}
      </span>
    );
  }

  return (
    <AppButton
      type="button"
      size={compact ? "sm" : "default"}
      variant={workingToday ? "primary" : "outline"}
      className={cn(
        "rounded-xl",
        compact && "h-8 px-3 text-xs",
        workingToday &&
          "bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-600",
      )}
      onClick={() => void toggle()}
      aria-pressed={workingToday}
      aria-label={
        workingToday
          ? `Mark ${staffName} off today`
          : `Mark ${staffName} working today`
      }
    >
      {workingToday ? "Working" : "Off"}
    </AppButton>
  );
}

export function isStaffWorkingToday(
  status: "active" | "inactive" | "on_leave",
  daySchedule: Record<string, boolean>,
  today: string,
): boolean {
  return isStaffWorkingOnDate(status, daySchedule, today);
}
