"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import type { BookingStaffItem } from "../../config/booking-staff-mock";

export type CtaColorVariant = "burgundy-black" | "wine" | "hot-pink";

const ctaThemes: Record<
  CtaColorVariant,
  {
    pageNote: string;
    card: string;
    name: string;
    role: string;
    photoRing: string;
    buttonAvailable: string;
    buttonUnavailable: string;
  }
> = {
  "burgundy-black": {
    pageNote: "Black page · Burgundy CTA",
    card: "border-white/10 bg-[#1a1a1a] shadow-[0_8px_28px_-12px_rgba(0,0,0,0.65)]",
    name: "text-white",
    role: "text-white/55",
    photoRing: "ring-white/10",
    buttonAvailable:
      "border border-white/15 bg-[#8B1E3F] text-white shadow-[0_8px_20px_rgba(139,30,63,0.35)] hover:bg-[#9c2548]",
    buttonUnavailable: "bg-white/10 text-white/35",
  },
  wine: {
    pageNote: "Wine red gradient CTA",
    card: "border-stone-200/80 bg-white shadow-[0_2px_16px_-8px_rgba(0,0,0,0.08)]",
    name: "text-stone-900",
    role: "text-stone-500",
    photoRing: "ring-stone-100",
    buttonAvailable:
      "border border-white/20 bg-gradient-to-b from-[#A1122F] to-[#8B1E2D] text-white shadow-[0_8px_20px_rgba(139,30,45,0.28)] hover:from-[#b51636] hover:to-[#9a2233]",
    buttonUnavailable: "bg-stone-100 text-stone-400",
  },
  "hot-pink": {
    pageNote: "Deep hot-pink CTA",
    card: "border-stone-200/80 bg-white shadow-[0_2px_16px_-8px_rgba(0,0,0,0.08)]",
    name: "text-stone-900",
    role: "text-stone-500",
    photoRing: "ring-stone-100",
    buttonAvailable:
      "border border-white/20 bg-[#D81B60] text-white shadow-[0_8px_20px_rgba(216,27,96,0.3)] hover:bg-[#c2185b]",
    buttonUnavailable: "bg-stone-100 text-stone-400",
  },
};

function StaffPhoto({
  staff,
  ringClass,
}: {
  staff: BookingStaffItem;
  ringClass: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        "relative size-28 shrink-0 overflow-hidden rounded-full bg-stone-100 shadow-md ring-2",
        ringClass,
      )}
    >
      {imageError || !staff.photoUrl ? (
        <div className="flex size-full items-center justify-center bg-stone-100 text-sm font-semibold text-stone-500">
          {staff.initials}
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={staff.photoUrl}
          alt={staff.name}
          className="size-full object-cover object-top"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

/** Live-booking style list with alternate Book Now colors (preview only). */
export function BookingSampleCtaColors({
  staff,
  variant,
}: {
  staff: BookingStaffItem[];
  variant: CtaColorVariant;
}) {
  const theme = ctaThemes[variant];

  return (
    <div className="space-y-3">
      <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {theme.pageNote}
      </p>
      {staff.map((member) => (
        <article
          key={member.id}
          className={cn(
            "flex items-center gap-4 rounded-2xl px-3 py-3.5",
            theme.card,
          )}
        >
          <StaffPhoto staff={member} ringClass={theme.photoRing} />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div>
              <p className={cn("truncate text-base font-semibold", theme.name)}>
                {member.name}
              </p>
              <p className={cn("truncate text-xs", theme.role)}>{member.role}</p>
            </div>
            <span
              aria-hidden
              className={cn(
                "inline-flex h-10 w-full max-w-[220px] items-center justify-center whitespace-nowrap rounded-xl px-3 text-[13px] font-semibold tracking-[0.2px]",
                member.available
                  ? theme.buttonAvailable
                  : theme.buttonUnavailable,
              )}
            >
              {member.available ? "Book Now" : "Unavailable"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
