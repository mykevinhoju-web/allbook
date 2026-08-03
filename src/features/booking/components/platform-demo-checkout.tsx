"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  DEMO_SERVICE_OPTIONS,
  buildDemoTimeSlots,
  getDemoStaffById,
  type BookingStaffItem,
} from "../config/booking-staff-mock";
import { bookingCustomerTheme as theme } from "../lib/booking-customer-theme";
import {
  formatCustomerBookingName,
  isValidCustomerBookingNameParts,
} from "../lib/customer-booking-name";
import {
  AU_MOBILE_PREFIX,
  formatAuMobileInput,
  isValidAuMobile,
  normalizeAuMobile,
} from "../lib/au-contact";
import { todayDateInZone, DEFAULT_BOOKING_TIMEZONE } from "../lib/schedule-utils";

type Step = "form" | "done";

function formatDemoPrice(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function StaffPhoto({ staff }: { staff: BookingStaffItem }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={theme.photoHero}>
      {imageError || !staff.photoUrl ? (
        <div className={theme.photoFallback}>{staff.initials}</div>
      ) : (
        <Image
          src={staff.photoUrl}
          alt={staff.name}
          fill
          sizes="112px"
          className="object-cover object-top"
          unoptimized
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

export function PlatformDemoCheckout({
  staffId,
  onBack,
  embedded = false,
}: {
  staffId: string;
  onBack?: () => void;
  /** When true, render without full-page shell (for mobile sheet). */
  embedded?: boolean;
}) {
  const staff = getDemoStaffById(staffId) ?? null;
  const [step, setStep] = useState<Step>("form");
  const [bookingDate, setBookingDate] = useState(() =>
    todayDateInZone(DEFAULT_BOOKING_TIMEZONE),
  );
  const [durationMinutes, setDurationMinutes] = useState(
    String(DEMO_SERVICE_OPTIONS[2].durationMinutes),
  );
  const [startsAt, setStartsAt] = useState("");
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerSecondName, setCustomerSecondName] = useState("");
  const [customerPhone, setCustomerPhone] = useState(AU_MOBILE_PREFIX);
  const [formHint, setFormHint] = useState<string | null>(null);

  const timeSlots = useMemo(
    () => buildDemoTimeSlots(bookingDate),
    [bookingDate],
  );

  const selectedService = useMemo(
    () =>
      DEMO_SERVICE_OPTIONS.find(
        (option) => String(option.durationMinutes) === durationMinutes,
      ) ?? DEMO_SERVICE_OPTIONS[2],
    [durationMinutes],
  );

  const canSubmit =
    Boolean(staff) &&
    Boolean(bookingDate) &&
    Boolean(startsAt) &&
    isValidCustomerBookingNameParts(customerFirstName, customerSecondName) &&
    isValidAuMobile(customerPhone);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setFormHint("Please complete all fields to continue.");
      return;
    }
    setFormHint(null);
    setStep("done");
  };

  if (!staff) {
    return (
      <div className={cn(!embedded && theme.page)}>
        <div
          className={cn(
            "flex flex-col items-center justify-center px-6 text-center",
            embedded ? "py-16" : "min-h-svh",
          )}
        >
          <p className={theme.sectionTitle}>Staff not found</p>
          <p className={cn(theme.bodyMuted, "mt-2")}>
            Please choose another therapist.
          </p>
          {onBack ? (
            <button type="button" onClick={onBack} className={cn(theme.goldButton, "mt-6 max-w-xs")}>
              Back
            </button>
          ) : (
            <Link href="/booking" className={cn(theme.goldButton, "mt-6 max-w-xs")}>
              Choose another
            </Link>
          )}
        </div>
      </div>
    );
  }

  const body = (
    <>
      <header className={theme.headerCompact}>
        {step !== "done" ? (
          onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={theme.backButton}
              aria-label="Back"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : (
            <Link href="/booking" className={theme.backButton} aria-label="Back">
              <ChevronLeft className="size-5" />
            </Link>
          )
        ) : (
          <span className="size-9" />
        )}
        <div className="min-w-0 flex-1">
          <p className={theme.eyebrow}>
            {step === "done" ? "Confirmed" : "Book appointment"}
          </p>
          <h1 className={theme.titleCompact}>{staff.name}</h1>
        </div>
      </header>

      <div className="space-y-5 px-4 py-5 pb-10">
        {step === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <StaffPhoto staff={staff} />
            <div className="text-center">
              <p className={theme.sectionTitle}>{staff.name}</p>
              <p className={theme.role}>{staff.role}</p>
            </div>

            <div>
              <label className={theme.label}>Duration</label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DEMO_SERVICE_OPTIONS.map((option) => {
                  const selected = durationMinutes === String(option.durationMinutes);
                  return (
                    <button
                      key={option.durationMinutes}
                      type="button"
                      onClick={() => setDurationMinutes(String(option.durationMinutes))}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-center transition",
                        selected
                          ? theme.goldChipSelected
                          : cn("border-stone-200", theme.goldChipIdle),
                      )}
                    >
                      <span className="block text-sm">{option.label}</span>
                      <span className="mt-0.5 block text-[11px] opacity-80">
                        {formatDemoPrice(option.priceCents)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="demo-date" className={theme.label}>
                Date
              </label>
              <Input
                id="demo-date"
                type="date"
                min={todayDateInZone(DEFAULT_BOOKING_TIMEZONE)}
                value={bookingDate}
                onChange={(event) => {
                  setBookingDate(event.target.value);
                  setStartsAt("");
                }}
                className={cn(theme.field, "mt-1.5")}
              />
            </div>

            <div>
              <label htmlFor="demo-time" className={theme.label}>
                Time
              </label>
              <select
                id="demo-time"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className={theme.field}
              >
                <option value="">Select a time</option>
                {timeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="demo-first" className={theme.label}>
                  First name
                </label>
                <Input
                  id="demo-first"
                  value={customerFirstName}
                  onChange={(event) => setCustomerFirstName(event.target.value)}
                  className={theme.field}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label htmlFor="demo-second" className={theme.label}>
                  Last name
                </label>
                <Input
                  id="demo-second"
                  value={customerSecondName}
                  onChange={(event) => setCustomerSecondName(event.target.value)}
                  className={theme.field}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="demo-phone" className={theme.label}>
                Mobile
              </label>
              <Input
                id="demo-phone"
                inputMode="tel"
                value={customerPhone}
                onChange={(event) =>
                  setCustomerPhone(formatAuMobileInput(event.target.value))
                }
                className={theme.field}
                autoComplete="tel"
              />
            </div>

            <div className={theme.priceBox}>
              <p className={theme.priceLabel}>Total</p>
              <p className={theme.priceValue}>
                {formatDemoPrice(selectedService.priceCents)}
              </p>
              <p className={cn(theme.helperText, "mt-1")}>Demo only · no payment</p>
            </div>

            {formHint ? <p className={theme.errorState}>{formHint}</p> : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className={theme.goldButton}
            >
              Confirm booking
            </button>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="space-y-5 text-center">
            <CheckCircle2 className={theme.successIcon} />
            <div>
              <p className={theme.sectionTitle}>You&apos;re booked</p>
              <p className={cn(theme.bodyMuted, "mt-2")}>
                {formatCustomerBookingName(customerFirstName, customerSecondName)} ·{" "}
                {staff.name}
              </p>
              <p className={cn(theme.bodyMuted, "mt-1")}>
                {bookingDate} · {timeSlots.find((s) => s.value === startsAt)?.label} ·{" "}
                {selectedService.label}
              </p>
              <p className={cn(theme.helperText, "mt-3")}>
                Demo booking only — nothing was saved.
                {normalizeAuMobile(customerPhone)
                  ? ` (${normalizeAuMobile(customerPhone)})`
                  : ""}
              </p>
            </div>
            {onBack ? (
              <button type="button" onClick={onBack} className={theme.goldButton}>
                Done
              </button>
            ) : (
              <Link href="/booking" className={theme.goldButton}>
                Book another
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </>
  );

  if (embedded) {
    return <div className="bg-white text-stone-900">{body}</div>;
  }

  return (
    <div className={theme.page}>
      <div className={theme.shell}>{body}</div>
    </div>
  );
}
