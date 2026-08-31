"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "@/components/common";
import { cn } from "@/lib/utils";

import { EverLogo } from "./ever-logo";
import { EVER_BRAND } from "../theme";
import type { EverService } from "../types";

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
  return new Date().toISOString().slice(0, 10);
}

export function EverBookingForm() {
  const [services, setServices] = useState<EverService[]>([]);
  const [currency, setCurrency] = useState("AUD");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      if (data.services?.[0]) {
        setServiceId(data.services[0].id);
      }
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
          <h1 className="mt-3 text-3xl font-light tracking-tight">
            Thank you
          </h1>
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
      <div className="mx-auto max-w-2xl">
        <p
          className="text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: EVER_BRAND.gold }}
        >
          Book a visit
        </p>
        <h1 className="mt-2 text-3xl font-light tracking-tight sm:text-4xl">
          Request an appointment
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: EVER_BRAND.textMuted }}>
          Choose your preferred date and time, select a treatment, and leave your
          contact details. We&apos;ll confirm your booking soon.
        </p>

        {loading ? (
          <p className="mt-10 text-sm" style={{ color: EVER_BRAND.textMuted }}>
            Loading services…
          </p>
        ) : (
          <form
            className="mt-10 space-y-8"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <section className="space-y-4">
              <h2 className="text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                Date &amp; time
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm">
                  <span style={{ color: EVER_BRAND.textMuted }}>Date</span>
                  <input
                    type="date"
                    value={date}
                    min={todayIso()}
                    onChange={(event) => setDate(event.target.value)}
                    required
                    className={everInputClass}
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span style={{ color: EVER_BRAND.textMuted }}>Time</span>
                  <select
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    required
                    className={everInputClass}
                  >
                    <option value="">Select time</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                Service
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
              {selectedService && (
                <p className="text-xs" style={{ color: EVER_BRAND.textMuted }}>
                  Selected: {selectedService.name}
                  {selectedService.priceCents !== null
                    ? ` · ${formatPrice(selectedService.priceCents, currency)}`
                    : ""}
                </p>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-medium" style={{ color: EVER_BRAND.goldSoft }}>
                Your details
              </h2>
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

            <button
              type="submit"
              disabled={submitting || services.length === 0}
              className="w-full rounded-full px-6 py-3.5 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: EVER_BRAND.gold, color: EVER_BRAND.forestDeep }}
            >
              {submitting ? "Sending request…" : "Request booking"}
            </button>
          </form>
        )}
      </div>
    </EverBookingShell>
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
      <header className="mx-auto mb-12 flex max-w-2xl items-center justify-between">
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
