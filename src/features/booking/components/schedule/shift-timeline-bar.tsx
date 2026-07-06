"use client";

import { cn } from "@/lib/utils";

import {
  buildShiftTimeline,
  segmentWidthPercent,
  type ShiftTimelineSegmentKind,
} from "../../lib/shift-timeline";
import { formatAmPmTime, formatShiftDateTime } from "../../lib/schedule-utils";

interface ShiftTimelineBarProps {
  shiftStartIso: string;
  shiftEndIso: string;
  /** Original shift open time (ISO), shown below the bar when set. */
  startedAtIso?: string | null;
  bookings: { startsAt: string; endsAt: string; status?: string }[];
  timeZone: string;
  className?: string;
}

const segmentStyles: Record<ShiftTimelineSegmentKind, string> = {
  booked: "bg-primary",
  available:
    "bg-muted/30 bg-[repeating-linear-gradient(-45deg,transparent,transparent_3px,hsl(var(--border)/0.45)_3px,hsl(var(--border)/0.45)_6px)]",
  past: "bg-muted/70",
};

export function ShiftTimelineBar({
  shiftStartIso,
  shiftEndIso,
  startedAtIso = null,
  bookings,
  timeZone,
  className,
}: ShiftTimelineBarProps) {
  const timeline = buildShiftTimeline(shiftStartIso, shiftEndIso, bookings);

  if (!timeline) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="flex h-4 overflow-hidden rounded-lg border border-border/60 bg-background shadow-inner"
        role="img"
        aria-label="Shift availability timeline"
      >
        {timeline.segments.map((segment, index) => (
          <div
            key={`${segment.kind}-${segment.startMs}-${index}`}
            className={cn("h-full min-w-0", segmentStyles[segment.kind])}
            style={{ width: `${segmentWidthPercent(segment, timeline)}%` }}
            title={
              segment.kind === "booked"
                ? "Booked"
                : segment.kind === "past"
                  ? "Past"
                  : "Open"
            }
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] font-medium tabular-nums text-muted-foreground">
        <span>{formatAmPmTime(shiftStartIso)}</span>
        <span className="text-[9px] uppercase tracking-wider">
          <span className="mr-2 inline-block size-2 rounded-sm bg-primary align-middle" />
          Booked
          <span className="mx-2 inline-block size-2 rounded-sm border border-border/60 bg-muted/30 align-middle" />
          Open
        </span>
        <span>{formatAmPmTime(shiftEndIso)}</span>
      </div>

      {startedAtIso ? (
        <p className="text-center text-[11px] text-muted-foreground">
          Started at{" "}
          <span className="font-semibold text-foreground">
            {formatShiftDateTime(startedAtIso, timeZone)}
          </span>
        </p>
      ) : null}
    </div>
  );
}
