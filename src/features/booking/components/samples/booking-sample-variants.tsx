import { cn } from "@/lib/utils";

import type { BookingStaffItem } from "../../config/booking-staff-mock";

function StaffPhoto({
  staff,
  size = "md",
}: {
  staff: BookingStaffItem;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass = {
    sm: "size-14",
    md: "size-16",
    lg: "size-20",
    xl: "size-24",
  }[size];

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full bg-gradient-to-br shadow-sm ring-2 ring-background",
        sizeClass,
        staff.accent,
      )}
      aria-hidden="true"
    >
      <div className="flex size-full items-center justify-center text-sm font-semibold text-white/90">
        {staff.initials}
      </div>
    </div>
  );
}

function BookButton({
  available,
  variant = "pill",
  className,
}: {
  available: boolean;
  variant?: "pill" | "full" | "outline";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

  const variants = {
    pill: cn(
      base,
      "h-9 min-w-[72px] rounded-full px-4 text-sm",
      available
        ? "bg-primary text-primary-foreground shadow-sm"
        : "bg-muted text-muted-foreground",
    ),
    full: cn(
      base,
      "h-11 w-full rounded-xl text-sm",
      available
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground",
    ),
    outline: cn(
      base,
      "h-10 w-full rounded-xl border text-sm",
      available
        ? "border-primary text-primary"
        : "border-border text-muted-foreground",
    ),
  };

  return (
    <button type="button" className={cn(variants[variant], className)} disabled={!available}>
      {available ? "Book" : "Unavailable"}
    </button>
  );
}

interface BookingSampleListProps {
  staff: BookingStaffItem[];
}

/** Sample 1 — Clean list rows (Apple-style) */
export function BookingSampleList({ staff }: BookingSampleListProps) {
  return (
    <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
      {staff.map((member) => (
        <li
          key={member.id}
          className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-muted/40"
        >
          <StaffPhoto staff={member} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{member.name}</p>
            <p className="truncate text-xs text-muted-foreground">{member.role}</p>
          </div>
          <BookButton available={member.available} variant="pill" />
        </li>
      ))}
    </ul>
  );
}

/** Sample 2 — Stacked cards with full-width CTA */
export function BookingSampleCards({ staff }: BookingSampleListProps) {
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
            <BookButton available={member.available} variant="full" />
          </div>
        </article>
      ))}
    </div>
  );
}

/** Sample 3 — Portrait-first minimal rows */
export function BookingSamplePortrait({ staff }: BookingSampleListProps) {
  return (
    <div className="space-y-2">
      {staff.map((member) => (
        <article
          key={member.id}
          className="flex items-center gap-4 rounded-2xl bg-card px-3 py-3 shadow-soft ring-1 ring-border/40"
        >
          <StaffPhoto staff={member} size="xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div>
              <p className="text-base font-semibold">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
            <BookButton available={member.available} variant="outline" />
          </div>
        </article>
      ))}
    </div>
  );
}
