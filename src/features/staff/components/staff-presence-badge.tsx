"use client";

import { cn } from "@/lib/utils";

import type { StaffPresence } from "../types";

interface StaffPresenceBadgeProps {
  presence: StaffPresence;
  roomName?: string | null;
  className?: string;
}

export function StaffPresenceBadge({
  presence,
  roomName,
  className,
}: StaffPresenceBadgeProps) {
  const onShift = presence === "online" || presence === "in_service";
  const room = roomName?.trim() || "";

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
          onShift
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-border/70 bg-muted/50 text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            onShift ? "bg-emerald-500" : "bg-muted-foreground/50",
          )}
        />
        {onShift ? "online" : "offline"}
      </span>
      {room ? (
        <span className="inline-flex shrink-0 items-center rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
          {room}
        </span>
      ) : null}
    </span>
  );
}
