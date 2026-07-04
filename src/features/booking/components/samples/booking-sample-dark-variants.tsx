"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import type { BookingStaffItem } from "../../config/booking-staff-mock";
import { useBookStaff } from "../../hooks/use-book-staff";
import { useBookingStaffList } from "../../hooks/use-booking-staff-list";

function DarkStaffPhoto({
  staff,
  className,
}: {
  staff: BookingStaffItem;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-stone-900",
        className,
      )}
    >
      {imageError ? (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950 text-lg font-light text-rose-200/80">
          {staff.initials}
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={staff.photoUrl}
          alt={staff.name}
          className="size-full object-cover object-top brightness-[0.92] contrast-[1.05] saturate-[0.9]"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

function ReserveButton({
  staff,
  className,
  label = "Book",
}: {
  staff: BookingStaffItem;
  className?: string;
  label?: string;
}) {
  const { bookStaff } = useBookStaff();
  const available = staff.available;

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => bookStaff(staff)}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 text-sm font-medium tracking-wide transition-all active:scale-[0.98] disabled:opacity-40",
        available
          ? "bg-gradient-to-r from-rose-900/90 to-amber-900/80 text-rose-50 shadow-[0_0_24px_-4px_rgba(190,24,93,0.45)]"
          : "border border-stone-700 bg-stone-900/80 text-stone-500",
        className,
      )}
    >
      {available ? label : "Unavailable"}
    </button>
  );
}

interface DarkSampleProps {
  staff?: BookingStaffItem[];
}

/** Sample 4 — Noir cinematic cards with full-bleed portraits */
export function BookingSampleNoir() {
  const { staff, loading } = useBookingStaffList();

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-stone-500">Loading staff…</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-xs tracking-[0.2em] text-stone-500 uppercase">
        Select your companion
      </p>
      {staff.map((member) => (
        <article
          key={member.id}
          className="group relative overflow-hidden rounded-2xl ring-1 ring-stone-800/80"
        >
          <div className="relative aspect-[3/4] max-h-[22rem]">
            <DarkStaffPhoto staff={member} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-rose-950/20 via-transparent to-amber-950/10" />

            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xl font-light tracking-wide text-stone-50">
                    {member.name}
                  </p>
                  <p className="mt-0.5 text-xs text-rose-200/70">{member.role}</p>
                </div>
                {member.available ? (
                  <Sparkles className="size-4 shrink-0 text-amber-400/60" />
                ) : null}
              </div>
              <ReserveButton
                staff={member}
                className="mt-3 h-11 w-full rounded-xl"
                label="Reserve privately"
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/** Sample 5 — Velvet lounge rows with soft glow borders */
export function BookingSampleVelvet() {
  const { staff, loading } = useBookingStaffList();

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-stone-500">Loading staff…</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-rose-900/30 bg-gradient-to-br from-stone-900/80 to-stone-950 px-4 py-3 text-center">
        <p className="text-[11px] tracking-[0.25em] text-rose-300/60 uppercase">
          Velvet lounge
        </p>
        <p className="mt-1 text-sm font-light text-stone-300">
          Discreet bookings · After 6pm
        </p>
      </div>

      {staff.map((member) => (
        <article
          key={member.id}
          className={cn(
            "flex items-center gap-3 rounded-2xl p-2.5 ring-1 transition-colors",
            member.available
              ? "bg-stone-900/60 ring-rose-900/35 shadow-[inset_0_1px_0_0_rgba(251,207,232,0.06)]"
              : "bg-stone-950/80 ring-stone-800/60 opacity-70",
          )}
        >
          <DarkStaffPhoto
            staff={member}
            className="size-[4.5rem] shrink-0 rounded-xl ring-1 ring-rose-900/25"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium text-stone-100">
              {member.name}
            </p>
            <p className="truncate text-xs text-rose-200/55">{member.role}</p>
            <ReserveButton
              staff={member}
              className="mt-2 h-9 w-full rounded-lg px-3 text-xs"
              label="Request"
            />
          </div>
        </article>
      ))}
    </div>
  );
}
