"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import type { BookingStaffItem } from "../../config/booking-staff-mock";
import { useBookStaff } from "../../hooks/use-book-staff";
import { useBookingStaffList } from "../../hooks/use-booking-staff-list";

type SampleTone = "default" | "pink";

function StaffPhoto({
  staff,
  size = "md",
  tone = "default",
}: {
  staff: BookingStaffItem;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: SampleTone;
}) {
  const [imageError, setImageError] = useState(false);
  const isPink = tone === "pink";

  const sizeClass = {
    sm: "size-14",
    md: "size-16",
    lg: "size-20",
    xl: "size-24",
  }[size];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full shadow-sm",
        isPink
          ? "bg-rose-50 ring-2 ring-rose-100 shadow-rose-100/40"
          : "bg-muted ring-2 ring-background",
        sizeClass,
      )}
    >
      {imageError || !staff.photoUrl ? (
        <div
          className={cn(
            "flex size-full items-center justify-center text-sm font-semibold",
            isPink ? "bg-rose-50 text-rose-500" : "bg-primary/10 text-primary",
          )}
        >
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

function BookButton({
  staff,
  variant = "pill",
  tone = "default",
  className,
}: {
  staff: BookingStaffItem;
  variant?: "pill" | "full" | "outline";
  tone?: SampleTone;
  className?: string;
}) {
  const { bookStaff } = useBookStaff();
  const available = staff.available;
  const isPink = tone === "pink";

  const base =
    "inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

  const variants = {
    pill: cn(
      base,
      "h-9 min-w-[72px] rounded-full px-4 text-sm",
      available
        ? isPink
          ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-sm shadow-rose-200/60"
          : "bg-primary text-primary-foreground shadow-sm"
        : isPink
          ? "bg-rose-50 text-rose-300"
          : "bg-muted text-muted-foreground",
    ),
    full: cn(
      base,
      "h-11 w-full rounded-xl text-sm",
      available
        ? isPink
          ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-sm shadow-rose-200/60"
          : "bg-primary text-primary-foreground"
        : isPink
          ? "bg-rose-50 text-rose-300"
          : "bg-muted text-muted-foreground",
    ),
    outline: cn(
      base,
      "h-10 w-full rounded-xl border text-sm",
      available
        ? isPink
          ? "border-rose-300 bg-white text-rose-600 active:bg-rose-50"
          : "border-primary text-primary"
        : isPink
          ? "border-rose-100 text-rose-300"
          : "border-border text-muted-foreground",
    ),
  };

  return (
    <button
      type="button"
      className={cn(variants[variant], className)}
      disabled={!available}
      onClick={() => bookStaff(staff)}
    >
      {available ? "Book" : "Unavailable"}
    </button>
  );
}

interface BookingSampleListProps {
  staff?: BookingStaffItem[];
  tone?: SampleTone;
}

interface BookingSamplePortraitProps extends BookingSampleListProps {
  buttonTone?: SampleTone;
  buttonVariant?: "pill" | "full" | "outline";
}

function SampleLoading() {
  return (
    <div className="space-y-3 py-6 text-center text-sm text-muted-foreground">
      Loading staff…
    </div>
  );
}

/** Sample 1 — Clean list rows (Apple-style) */
export function BookingSampleList({ tone = "default" }: BookingSampleListProps) {
  const { staff, loading } = useBookingStaffList();
  const isPink = tone === "pink";

  if (loading) return <SampleLoading />;

  return (
    <ul
      className={cn(
        "divide-y overflow-hidden rounded-2xl border shadow-soft",
        isPink
          ? "divide-rose-100 border-rose-100 bg-white shadow-[0_4px_24px_-8px_rgba(251,113,133,0.2)]"
          : "divide-border/60 border-border/60 bg-card",
      )}
    >
      {staff.map((member) => (
        <li
          key={member.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3.5 transition-colors",
            isPink ? "active:bg-rose-50/70" : "active:bg-muted/40",
          )}
        >
          <StaffPhoto staff={member} size="md" tone={tone} />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate font-medium",
                isPink ? "text-stone-800" : "text-foreground",
              )}
            >
              {member.name}
            </p>
            <p
              className={cn(
                "truncate text-xs",
                isPink ? "text-rose-400/80" : "text-muted-foreground",
              )}
            >
              {member.role}
            </p>
          </div>
          <BookButton staff={member} variant="pill" tone={tone} />
        </li>
      ))}
    </ul>
  );
}

/** Sample 2 — Stacked cards with full-width CTA */
export function BookingSampleCards() {
  const { staff, loading } = useBookingStaffList();

  if (loading) return <SampleLoading />;

  return (
    <div className="space-y-3">
      {staff.map((member) => (
        <article
          key={member.id}
          className="overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-soft"
        >
          <div className="flex items-center gap-4">
            <StaffPhoto staff={member} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold tracking-tight">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          </div>
          <div className="mt-4">
            <BookButton staff={member} variant="full" />
          </div>
        </article>
      ))}
    </div>
  );
}

/** Sample 3 — Portrait-first minimal rows */
export function BookingSamplePortrait({
  tone = "default",
  buttonTone,
  buttonVariant = "outline",
}: BookingSamplePortraitProps) {
  const { staff, loading } = useBookingStaffList();
  const isPink = tone === "pink";
  const resolvedButtonTone = buttonTone ?? tone;

  if (loading) return <SampleLoading />;

  return (
    <div className="space-y-2">
      {staff.map((member) => (
        <article
          key={member.id}
          className={cn(
            "flex items-center gap-4 rounded-2xl px-3 py-3 shadow-soft",
            isPink
              ? "bg-white ring-1 ring-rose-100 shadow-[0_2px_16px_-6px_rgba(251,113,133,0.18)]"
              : "bg-card ring-1 ring-border/40",
          )}
        >
          <StaffPhoto staff={member} size="xl" tone={tone} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div>
              <p
                className={cn(
                  "text-base font-semibold",
                  isPink ? "text-stone-800" : undefined,
                )}
              >
                {member.name}
              </p>
              <p
                className={cn(
                  "text-xs",
                  isPink ? "text-rose-400/80" : "text-muted-foreground",
                )}
              >
                {member.role}
              </p>
            </div>
            <BookButton
              staff={member}
              variant={buttonVariant}
              tone={resolvedButtonTone}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
