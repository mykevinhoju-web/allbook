"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "@/components/common";
import { cn } from "@/lib/utils";

import { EverLogo } from "./ever-logo";
import { EVER_BRAND } from "../theme";
import type { EverService } from "../types";

const STEPS = ["Date", "Time", "Service", "Details"] as const;
type Step = (typeof STEPS)[number];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

const TIME_SLOTS = Array.from({ length: 19 }, (_, index) => {
  const totalMinutes = 9 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

function formatPrice(cents: number | null, currency: string): string {
  if (cents === null) return "";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toIso(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

function formatDisplayDate(iso: string): string {
  return parseIso(iso).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EverBookingForm() {
  const [services, setServices] = useState<EverService[]>([]);
  const [currency, setCurrency] = useState("AUD");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<Step>("Date");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPostcode, setCustomerPostcode] = useState("");

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ever/services");
      const data = (await response.json()) as {
        services?: EverService[];
        currency?: string;
        error?: string;
      };

      if (!response.ok) {
        toast.error("Could not load services", {
          description: data.error ?? "Please try again.",
        });
        return;
      }

      setServices(data.services ?? []);
      setCurrency(data.currency ?? "AUD");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [serviceId, services],
  );

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    if (step === "Date") {
      if (!date) {
        toast.error("Please select a date.");
        return;
      }
      setStep("Time");
      return;
    }
    if (step === "Time") {
      if (!time) {
        toast.error("Please select a time.");
        return;
      }
      setStep("Service");
      return;
    }
    if (step === "Service") {
      if (!serviceId) {
        toast.error("Please select a service.");
        return;
      }
      setStep("Details");
    }
  };

  const goBack = () => {
    if (step === "Time") setStep("Date");
    else if (step === "Service") setStep("Time");
    else if (step === "Details") setStep("Service");
  };

  const submit = async () => {
    if (!date || !time || !serviceId) {
      toast.error("Please choose a date, time, and service.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/ever/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          serviceId,
          customerName,
          customerPhone,
          customerEmail,
          customerPostcode,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error("Booking failed", {
          description: data.error ?? "Please check your details.",
        });
        return;
      }

      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <EverBookingShell>
        <div className="mx-auto max-w-lg text-center">
          <p
            className="text-xs font-medium uppercase tracking-[0.2em]"
            style={{ color: EVER_BRAND.gold }}
          >
            Request received
          </p>
          <h1 className="mt-3 text-3xl font-light tracking-tight">Thank you</h1>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: EVER_BRAND.textMuted }}>
            We&apos;ve received your booking request and will confirm by email or phone shortly.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full px-6 py-3 text-sm font-medium transition hover:opacity-90"
            style={{ background: EVER_BRAND.gold, color: EVER_BRAND.forestDeep }}
          >
            Back to home
          </Link>
        </div>
      </EverBookingShell>
    );
  }

  return (
    <EverBookingShell>
      <div className="mx-auto max-w-xl">
        <p
          className="text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: EVER_BRAND.gold }}
        >
          Book a visit
        </p>
        <h1 className="mt-2 text-3xl font-light tracking-tight sm:text-4xl">
          Request an appointment
        </h1>

        <ol className="mt-8 flex items-center gap-1 sm:gap-2">
          {STEPS.map((label, index) => {
            const active = index === stepIndex;
            const done = index < stepIndex;
            return (
              <li key={label} className="flex flex-1 flex-col items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition",
                    active || done ? "text-[#121814]" : "text-white/40",
                  )}
                  style={{
                    background:
                      active || done ? EVER_BRAND.gold : "rgba(255,255,255,0.08)",
                  }}
                >
                  {index + 1}
                </span>
                <span
                  className="text-[10px] font-medium uppercase tracking-wider sm:text-xs"
                  style={{
                    color: active ? EVER_BRAND.goldSoft : EVER_BRAND.textMuted,
                  }}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        {loading ? (
          <p className="mt-10 text-sm" style={{ color: EVER_BRAND.textMuted }}>
            Loading…
          </p>
        ) : (
          <form
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (step === "Details") void submit();
              else goNext();
            }}
          >
            {step === "Date" && (
              <section>
                <h2 className="mb-4 text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                  Select a date
                </h2>
                <EverCalendar value={date} onChange={setDate} minDate={todayIso()} />
                {date && (
                  <p className="mt-4 text-sm" style={{ color: EVER_BRAND.textMuted }}>
                    Selected: {formatDisplayDate(date)}
                  </p>
                )}
              </section>
            )}

            {step === "Time" && (
              <section>
                <h2 className="mb-1 text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                  Select a time
                </h2>
                <p className="mb-4 text-xs" style={{ color: EVER_BRAND.textMuted }}>
                  {formatDisplayDate(date)}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {TIME_SLOTS.map((slot) => {
                    const active = time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={cn(
                          "rounded-xl border px-2 py-3 text-sm transition",
                          active
                            ? "border-[#C4A862]/60 bg-[#C4A862]/15 font-medium text-[#E9EDE8]"
                            : "border-white/10 bg-white/[0.03] text-[#E9EDE8]/80 hover:border-white/25",
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {step === "Service" && (
              <section>
                <h2 className="mb-4 text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                  Select a service
                </h2>
                <div className="space-y-2">
                  {services.map((service) => {
                    const active = service.id === serviceId;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setServiceId(service.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                          active
                            ? "border-[#C4A862]/60 bg-[#C4A862]/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20",
                        )}
                      >
                        <span>
                          <span className="block font-medium">{service.name}</span>
                          <span className="text-xs" style={{ color: EVER_BRAND.textMuted }}>
                            {service.durationMinutes} min
                          </span>
                        </span>
                        {service.priceCents !== null && (
                          <span
                            className="text-sm font-medium"
                            style={{ color: EVER_BRAND.gold }}
                          >
                            {formatPrice(service.priceCents, currency)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {step === "Details" && (
              <section className="space-y-4">
                <h2 className="text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                  Your details
                </h2>
                <div
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed"
                  style={{ color: EVER_BRAND.textMuted }}
                >
                  <p>
                    {formatDisplayDate(date)} · {time}
                  </p>
                  {selectedService && (
                    <p className="mt-1">
                      {selectedService.name}
                      {selectedService.priceCents !== null
                        ? ` · ${formatPrice(selectedService.priceCents, currency)}`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm sm:col-span-2">
                    <span style={{ color: EVER_BRAND.textMuted }}>Full name</span>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      required
                      autoComplete="name"
                      className={everInputClass}
                    />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span style={{ color: EVER_BRAND.textMuted }}>Phone</span>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      required
                      autoComplete="tel"
                      className={everInputClass}
                    />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span style={{ color: EVER_BRAND.textMuted }}>Postcode</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customerPostcode}
                      onChange={(event) => setCustomerPostcode(event.target.value)}
                      required
                      autoComplete="postal-code"
                      className={everInputClass}
                    />
                  </label>
                  <label className="block space-y-2 text-sm sm:col-span-2">
                    <span style={{ color: EVER_BRAND.textMuted }}>Email</span>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      required
                      autoComplete="email"
                      className={everInputClass}
                    />
                  </label>
                </div>
              </section>
            )}

            <div className="mt-8 flex gap-3">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-full border border-white/15 px-5 py-3.5 text-sm font-medium transition hover:border-white/30"
                  style={{ color: EVER_BRAND.text }}
                >
                  Back
                </button>
              )}
              {step === "Details" ? (
                <button
                  type="submit"
                  disabled={submitting || services.length === 0}
                  className="flex-1 rounded-full px-6 py-3.5 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: EVER_BRAND.gold, color: EVER_BRAND.forestDeep }}
                >
                  {submitting ? "Sending request…" : "Request booking"}
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 rounded-full px-6 py-3.5 text-sm font-medium transition hover:opacity-90"
                  style={{ background: EVER_BRAND.gold, color: EVER_BRAND.forestDeep }}
                >
                  Next
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </EverBookingShell>
  );
}

type EverCalendarProps = {
  value: string;
  onChange: (date: string) => void;
  minDate: string;
};

function EverCalendar({ value, onChange, minDate }: EverCalendarProps) {
  const initial = value ? parseIso(value) : parseIso(minDate);
  const [cursor, setCursor] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });

  const weeks = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startPad = first.getDay(); // Sunday-first
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: Array<{ iso: string; day: number; inMonth: boolean }[]> = [];
    let week: { iso: string; day: number; inMonth: boolean }[] = [];

    for (let i = 0; i < startPad; i += 1) {
      week.push({ iso: "", day: 0, inMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      week.push({
        iso: toIso(cursor.year, cursor.month, day),
        day,
        inMonth: true,
      });
      if (week.length === 7) {
        cells.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push({ iso: "", day: 0, inMonth: false });
      cells.push(week);
    }
    return cells;
  }, [cursor.month, cursor.year]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-AU",
    { month: "long", year: "numeric" },
  );

  const shiftMonth = (delta: number) => {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const minCursor = parseIso(minDate);
  const canGoPrev =
    cursor.year > minCursor.getFullYear() ||
    (cursor.year === minCursor.getFullYear() && cursor.month > minCursor.getMonth());

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#F7F6F2] text-[#1a1a1a]">
      <div className="flex items-end justify-between px-5 pb-2 pt-5">
        <div className="flex items-end gap-3">
          <span className="text-5xl font-semibold leading-none tracking-tight">
            {cursor.month + 1}
          </span>
          <span className="pb-1 text-sm font-semibold uppercase tracking-[0.12em]">
            {monthLabel}
          </span>
        </div>
        <div className="flex gap-1 pb-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoPrev}
            onClick={() => shiftMonth(-1)}
            className="rounded-lg p-1.5 text-[#1a1a1a]/70 transition hover:bg-black/5 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="rounded-lg p-1.5 text-[#1a1a1a]/70 transition hover:bg-black/5"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-t border-black/5 px-2 pb-1 pt-3 text-center text-[11px] font-semibold tracking-wide">
        {WEEKDAYS.map((day, index) => (
          <span key={day} className={index === 0 ? "text-[#c0392b]" : "text-[#1a1a1a]"}>
            {day}
          </span>
        ))}
      </div>

      <div className="space-y-1 px-2 pb-4 pt-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((cell, cellIndex) => {
              if (!cell.inMonth) {
                return <span key={`empty-${weekIndex}-${cellIndex}`} className="h-11" />;
              }

              const disabled = cell.iso < minDate;
              const selected = cell.iso === value;
              const isSunday = cellIndex === 0;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(cell.iso)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg text-sm font-medium transition",
                    disabled && "cursor-not-allowed opacity-25",
                    selected && "bg-[#1B2E26] text-[#F5F3EE]",
                    !selected && !disabled && "hover:bg-black/5",
                    !selected && isSunday && "text-[#c0392b]",
                    !selected && !isSunday && "text-[#1a1a1a]",
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const everInputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#E9EDE8] outline-none transition placeholder:text-white/30 focus:border-[#C4A862]/50 focus:ring-1 focus:ring-[#C4A862]/30";

function EverBookingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-svh px-5 py-10 sm:px-8"
      style={{ background: EVER_BRAND.forestDeep, color: EVER_BRAND.text }}
    >
      <header className="mx-auto mb-12 flex max-w-xl items-center justify-between">
        <Link href="/" className="inline-flex">
          <EverLogo className="h-9 w-auto" />
        </Link>
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-widest transition hover:opacity-80"
          style={{ color: EVER_BRAND.textMuted }}
        >
          Home
        </Link>
      </header>
      {children}
    </div>
  );
}
