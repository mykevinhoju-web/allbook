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
  if (presence === "in_service") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300",
          className,
        )}
      >
        <span className="size-1.5 shrink-0 rounded-full bg-sky-500" />
        {roomName?.trim() ? roomName : "In service"}
      </span>
    );
  }

  if (presence === "online") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300",
          className,
        )}
      >
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
        Online
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
      Offline
    </span>
  );
}
