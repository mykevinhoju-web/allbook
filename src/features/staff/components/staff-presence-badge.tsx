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
  const label = `${onShift ? "online" : "offline"}${room ? ` ${room}` : ""}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        onShift
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border/70 bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          onShift ? "bg-emerald-500" : "bg-muted-foreground/50",
        )}
      />
      {label}
    </span>
  );
}
