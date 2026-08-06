"use client";

import Link from "next/link";
import { Clock, Phone } from "lucide-react";

import { isSalonOpenNow } from "@/features/search/isSalonOpenNow";
import type { DayOfWeek, OpeningHours, SalonDetail } from "@/types/salon";
import { cn } from "@/lib/utils";

type StickyBookingCardProps = {
  salon: SalonDetail;
  bookHref: string;
  className?: string;
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const DAY_ORDER: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

function todayKey(): DayOfWeek {
  const map: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "short",
  }).formatToParts(new Date());
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const lookup: Record<string, DayOfWeek> = {
    Sun: "sun",
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
  };
  return lookup[weekday] ?? map[new Date().getDay()];
}

function todayHoursLine(hours: OpeningHours): string {
  const day = hours[todayKey()];
  if (!day || day.closed) return "Closed today";
  return `Today ${day.open} – ${day.close}`;
}

/**
 * Desktop sticky booking card: Book Now · Phone · Opening hours
 */
export function StickyBookingCard({
  salon,
  bookHref,
  className,
}: StickyBookingCardProps) {
  const isOpen = isSalonOpenNow(salon.openingHours);

  return (
    <aside
      className={cn(
        "rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-[0_16px_48px_rgba(17,17,17,0.06)] sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold tracking-tight text-neutral-950">
            Book an appointment
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-medium",
              isOpen ? "text-emerald-600" : "text-neutral-500",
            )}
          >
            {isOpen ? "Open now" : "Closed"}
            <span className="font-normal text-neutral-400">
              {" "}
              · {todayHoursLine(salon.openingHours)}
            </span>
          </p>
        </div>
      </div>

      <Link
        href={bookHref}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
      >
        Book Now
      </Link>

      {salon.phone ? (
        <a
          href={`tel:${salon.phone}`}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 text-sm font-semibold text-neutral-900 transition hover:border-neutral-300"
        >
          <Phone className="size-4" />
          {salon.phone}
        </a>
      ) : null}

      <div className="mt-5 border-t border-neutral-100 pt-4">
        <p className="mb-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          <Clock className="size-3.5" />
          Opening hours
        </p>
        <ul className="space-y-1.5 text-[13px]">
          {DAY_ORDER.map((day) => {
            const row = salon.openingHours[day];
            const isToday = day === todayKey();
            return (
              <li
                key={day}
                className={cn(
                  "flex items-center justify-between gap-3",
                  isToday ? "font-semibold text-neutral-950" : "text-neutral-600",
                )}
              >
                <span>{DAY_LABELS[day]}</span>
                <span className="tabular-nums">
                  {!row || row.closed
                    ? "Closed"
                    : `${row.open} – ${row.close}`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
