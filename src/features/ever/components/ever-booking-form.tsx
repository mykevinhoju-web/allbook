"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "@/components/common";
import { cn } from "@/lib/utils";

import { EverLogo } from "./ever-logo";
import { EVER_BRAND } from "../theme";
import type { EverService } from "../types";

const STEPS = ["date", "time", "service", "details"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  date: "Date",
  time: "Time",
  service: "Service",
  details: "Details",
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

const TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? 0 : 30;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

const AM_SLOTS = TIME_SLOTS.filter((slot) => Number(slot.slice(0, 2)) < 12);
const PM_SLOTS = TIME_SLOTS.filter((slot) => Number(slot.slice(0, 2)) >= 12);

function formatSlotLabel(slot: string): string {
  const [hourRaw, minute] = slot.split(":");
  const hour = Number(hourRaw);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute}`;
}

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
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplayDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
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
  const [step, setStep] = useState<Step>("date");

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
    if (step === "date" && !date) {
      toast.error("Please select a date.");
      return;
    }
    if (step === "time" && !time) {
      toast.error("Please select a time.");
      return;
    }
    if (step === "service" && !serviceId) {
      toast.error("Please select a service.");
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1]);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1]);
    }
  };

  const submit = async () => {
    if (!date || !time || !serviceId) {
      toast.error("Please complete date, time, and service.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim() || !customerPostcode.trim()) {
      toast.error("Please fill in your details.");
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
            We&apos;ve received your booking request and will confirm by email or
            phone shortly.
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
      <div className="mx-auto w-full max-w-xl pb-24 sm:pb-8">
        <p
          className="text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: EVER_BRAND.gold }}
        >
          Book a visit
        </p>
        <h1 className="mt-2 text-[1.75rem] font-light tracking-tight sm:text-4xl">
          Request an appointment
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: EVER_BRAND.textMuted }}>
          Choose a date, then a time, then a treatment, and leave your details.
        </p>

        <div className="-mx-1 mt-6 flex gap-1.5 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-8 sm:gap-2">
          {STEPS.map((id, index) => {
            const active = index === stepIndex;
            const done = index < stepIndex;
            return (
              <div
                key={id}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-semibold tracking-wide sm:px-3 sm:text-[11px]",
                  active || done
                    ? "text-[#121814]"
                    : "bg-white/5 text-white/40",
                )}
                style={
                  active || done
                    ? { background: active ? EVER_BRAND.gold : "rgba(196,168,98,0.45)" }
                    : undefined
                }
              >
                {index + 1}. {STEP_LABELS[id]}
              </div>
            );
          })}
        </div>

        {loading ? (
          <p className="mt-10 text-sm" style={{ color: EVER_BRAND.textMuted }}>
            Loading…
          </p>
        ) : (
          <div className="mt-6 sm:mt-8">
            {step === "date" && (
              <section className="space-y-4">
                <h2 className="text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                  Select a date
                </h2>
                <EverMonthCalendar value={date} onChange={setDate} />
                {date && (
                  <p className="text-xs" style={{ color: EVER_BRAND.textMuted }}>
                    Selected: {formatDisplayDate(date)}
                  </p>
                )}
              </section>
            )}

            {step === "time" && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                    Select a time
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: EVER_BRAND.textMuted }}>
                    {formatDisplayDate(date)}
                  </p>
                </div>
                <TimePeriodBlock
                  label="AM"
                  slots={AM_SLOTS}
                  selected={time}
                  onSelect={setTime}
                />
                <TimePeriodBlock
                  label="PM"
                  slots={PM_SLOTS}
                  selected={time}
                  onSelect={setTime}
                />
              </section>
            )}

            {step === "service" && (
              <section className="space-y-4">
                <h2 className="text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
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
                          <span className="text-sm font-medium" style={{ color: EVER_BRAND.gold }}>
                            {formatPrice(service.priceCents, currency)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {services.length === 0 && (
                  <p className="text-sm" style={{ color: EVER_BRAND.textMuted }}>
                    No services available right now.
                  </p>
                )}
              </section>
            )}

            {step === "details" && (
              <section className="space-y-4">
                <h2 className="text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                  Your details
                </h2>
                <div
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed"
                  style={{ color: EVER_BRAND.textMuted }}
                >
                  <p>
                    {formatDisplayDate(date)} · {formatSlotLabel(time)}{" "}
                    {Number(time.slice(0, 2)) < 12 ? "AM" : "PM"}
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

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#121814]/95 px-4 pt-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <div className="mx-auto flex max-w-xl gap-3">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="min-h-12 rounded-full border border-white/15 px-5 py-3 text-sm font-medium transition hover:border-white/30"
                    style={{ color: EVER_BRAND.text }}
                  >
                    Back
                  </button>
                )}
                {step !== "details" ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="min-h-12 flex-1 rounded-full px-6 py-3.5 text-sm font-medium transition hover:opacity-90"
                    style={{ background: EVER_BRAND.gold, color: EVER_BRAND.forestDeep }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting || services.length === 0}
                    onClick={() => void submit()}
                    className="min-h-12 flex-1 rounded-full px-6 py-3.5 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: EVER_BRAND.gold, color: EVER_BRAND.forestDeep }}
                  >
                    {submitting ? "Sending request…" : "Request booking"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </EverBookingShell>
  );
}

function TimePeriodBlock({
  label,
  slots,
  selected,
  onSelect,
}: {
  label: "AM" | "PM";
  slots: string[];
  selected: string;
  onSelect: (slot: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3" aria-hidden>
        <span
          className="shrink-0 text-[11px] font-semibold tracking-[0.18em]"
          style={{ color: EVER_BRAND.goldSoft }}
        >
          {label}
        </span>
        <div className="h-px min-w-0 flex-1 bg-white/15" />
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4 sm:gap-2">
        {slots.map((slot) => {
          const active = selected === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onSelect(slot)}
              className={cn(
                "min-h-11 rounded-xl border px-1.5 py-2.5 text-[13px] tabular-nums transition sm:min-h-12 sm:px-3 sm:text-sm",
                active
                  ? "border-[#C4A862]/70 bg-[#C4A862]/15 text-[#E9EDE8]"
                  : "border-white/10 bg-white/[0.03] text-[#E9EDE8]/80 hover:border-white/25",
              )}
            >
              {formatSlotLabel(slot)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EverMonthCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [cursor, setCursor] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });

  const today = todayIso();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay(); // Sunday=0

  const cells = useMemo(() => {
    const list: Array<{ day: number; iso: string } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) list.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push({ day, iso: toIso(cursor.year, cursor.month, day) });
    }
    return list;
  }, [cursor.month, cursor.year, daysInMonth, firstWeekday]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-AU",
    { month: "long", year: "numeric" },
  );

  const shiftMonth = (delta: number) => {
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  return (
    <div
      className="overflow-hidden rounded-3xl px-3 py-5 sm:px-6 sm:py-6"
      style={{ background: EVER_BRAND.cream, color: EVER_BRAND.forestDeep }}
    >
      <div className="mb-5 flex items-end justify-between gap-2 sm:mb-6 sm:gap-3">
        <div className="flex min-w-0 items-end gap-2 sm:gap-3">
          <span className="text-4xl font-semibold leading-none tracking-tight sm:text-6xl">
            {cursor.month + 1}
          </span>
          <span className="truncate pb-0.5 text-xs font-semibold uppercase tracking-[0.12em] sm:pb-1 sm:text-base sm:tracking-[0.14em]">
            {monthLabel}
          </span>
        </div>
        <div className="flex shrink-0 gap-1 pb-0.5 sm:pb-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-semibold tracking-wide sm:mb-3 sm:text-[11px]">
        {WEEKDAYS.map((day, index) => (
          <span
            key={day}
            style={{ color: index === 0 ? "#C45C5C" : "rgba(18,24,20,0.45)" }}
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 sm:gap-y-2">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-9 sm:h-11" />;
          }

          const weekday = (firstWeekday + cell.day - 1) % 7;
          const isSunday = weekday === 0;
          const disabled = cell.iso < today;
          const active = value === cell.iso;

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cell.iso)}
              className={cn(
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-medium tabular-nums transition sm:h-11 sm:w-11 sm:text-[15px]",
                disabled && "cursor-not-allowed opacity-25",
                active && "text-[#121814]",
                !disabled && !active && "hover:bg-black/5",
              )}
              style={
                active
                  ? { background: EVER_BRAND.gold }
                  : { color: isSunday ? "#C45C5C" : EVER_BRAND.forestDeep }
              }
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const everInputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#E9EDE8] outline-none transition placeholder:text-white/30 focus:border-[#C4A862]/50 focus:ring-1 focus:ring-[#C4A862]/30";

function EverBookingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-svh overflow-x-hidden px-4 py-8 sm:px-8 sm:py-10"
      style={{ background: EVER_BRAND.forestDeep, color: EVER_BRAND.text }}
    >
      <header className="mx-auto mb-8 flex max-w-xl items-center justify-between sm:mb-12">
        <Link href="/" className="inline-flex">
          <EverLogo className="h-8 w-auto sm:h-9" />
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
