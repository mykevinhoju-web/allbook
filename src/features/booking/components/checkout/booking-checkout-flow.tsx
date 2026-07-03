"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, ChevronLeft } from "lucide-react";

import { AppButton } from "@/components/common";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useOptionalTenant } from "@/features/tenants";
import {
  formatPriceFromCents,
  formatServiceOptionLabel,
} from "@/features/services";
import type { ServiceOption } from "@/features/services";

import {
  buildStartsAtIso,
  formatAmPmTime,
  formatScheduleDate,
  todayDateInputValue,
} from "../../lib/schedule-utils";

type Step = "service" | "details" | "payment" | "done";

interface BookingCheckoutFlowProps {
  staffId: string;
  returnTo?: string;
  theme?: "default" | "pastel";
}

interface StaffInfo {
  id: string;
  name: string;
  photoUrl: string | null;
  role: string;
}

interface CreatedBooking {
  id: string;
  staffName: string;
  roomName: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  priceCents: number;
}

export function BookingCheckoutFlow({
  staffId,
  returnTo = "/booking/samples",
  theme = "default",
}: BookingCheckoutFlowProps) {
  const tenant = useOptionalTenant();
  const isPastel = theme === "pastel";

  const [step, setStep] = useState<Step>("service");
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [currency, setCurrency] = useState("AUD");
  const [date, setDate] = useState(todayDateInputValue());
  const [durationMinutes, setDurationMinutes] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPostcode, setCustomerPostcode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<CreatedBooking | null>(null);

  useEffect(() => {
    if (!tenant) return;

    void (async () => {
      const [staffRes, servicesRes] = await Promise.all([
        fetch("/api/booking/staff"),
        fetch("/api/service-options"),
      ]);

      if (staffRes.ok) {
        const staffData = (await staffRes.json()) as {
          staff?: StaffInfo[];
          currency?: string;
        };
        const member = staffData.staff?.find((row) => row.id === staffId) ?? null;
        setStaff(member);
        if (staffData.currency) setCurrency(staffData.currency);
      }

      if (servicesRes.ok) {
        const servicesData = (await servicesRes.json()) as {
          options?: ServiceOption[];
          currency?: string;
        };
        setServiceOptions(servicesData.options ?? []);
        if (servicesData.currency) setCurrency(servicesData.currency);
        if (servicesData.options?.[0]) {
          setDurationMinutes(String(servicesData.options[0].durationMinutes));
        }
      }
    })();
  }, [tenant, staffId]);

  useEffect(() => {
    if (!durationMinutes || !staffId) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);

    void (async () => {
      try {
        const params = new URLSearchParams({
          staffId,
          date,
          durationMinutes,
        });
        const response = await fetch(`/api/booking/availability?${params}`);
        const data = (await response.json()) as { slots?: string[]; error?: string };

        if (!cancelled) {
          setSlots(data.slots ?? []);
          if (startsAt && !data.slots?.includes(startsAt)) {
            setStartsAt("");
          }
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [staffId, date, durationMinutes, startsAt]);

  const selectedOption = useMemo(
    () =>
      serviceOptions.find(
        (option) => String(option.durationMinutes) === durationMinutes,
      ),
    [serviceOptions, durationMinutes],
  );

  const priceLabel = selectedOption
    ? formatPriceFromCents(selectedOption.priceCents, currency)
    : null;

  const startsAtIso =
    startsAt && date ? buildStartsAtIso(date, startsAt) : null;

  const submitBooking = async () => {
    if (!startsAtIso || !durationMinutes) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          startsAt: startsAtIso,
          durationMinutes: Number(durationMinutes),
          customerName,
          customerPhone,
          customerEmail,
          customerPostcode,
        }),
      });

      const data = (await response.json()) as {
        booking?: CreatedBooking;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not complete booking");
      }

      setBooking(data.booking ?? null);
      setStep("done");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not complete booking",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!tenant) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold">Open on your spa site</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Booking requires a tenant subdomain (e.g. dayspa.allbook.com.au).
        </p>
        <Link href={returnTo} className="mt-6 text-sm font-medium text-primary">
          Back to samples
        </Link>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold">Staff not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This therapist may no longer be available.
        </p>
        <Link href={returnTo} className="mt-6 text-sm font-medium text-primary">
          Choose another
        </Link>
      </div>
    );
  }

  const shellClass = isPastel
    ? "min-h-svh bg-[#fce4ec] text-stone-800"
    : "min-h-svh bg-muted/30";

  const cardClass = isPastel
    ? "rounded-2xl border border-pink-200/80 bg-white/80 p-4 shadow-sm"
    : "rounded-2xl border border-border/60 bg-card p-4 shadow-soft";

  const primaryButtonClass = isPastel
    ? "h-11 w-full rounded-full border-2 border-[#e91e63] bg-white text-sm font-semibold text-[#e91e63]"
    : undefined;

  return (
    <div className={shellClass}>
      <div
        className={cn(
          "mx-auto min-h-svh max-w-md md:border-x",
          isPastel ? "border-pink-200/60" : "border-border/60 bg-background",
        )}
      >
        <header
          className={cn(
            "sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3",
            isPastel
              ? "border-pink-200/80 bg-[#fce4ec]/95"
              : "border-border/60 bg-background/95",
          )}
        >
          {step !== "done" ? (
            <Link
              href={step === "service" ? returnTo : "#"}
              onClick={(event) => {
                if (step === "details") {
                  event.preventDefault();
                  setStep("service");
                } else if (step === "payment") {
                  event.preventDefault();
                  setStep("details");
                }
              }}
              className={cn(
                "flex size-9 items-center justify-center rounded-full",
                isPastel ? "text-[#e91e63]" : "text-muted-foreground",
              )}
              aria-label="Back"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : (
            <span className="size-9" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-widest",
                isPastel ? "text-[#e91e63]" : "text-primary",
              )}
            >
              {step === "done" ? "Confirmed" : "Book appointment"}
            </p>
            <h1 className="truncate text-base font-semibold">{staff.name}</h1>
          </div>
        </header>

        <div className="space-y-4 px-4 py-4 pb-8">
          {step === "service" ? (
            <>
              <div className={cardClass}>
                <p className="text-sm text-muted-foreground">{staff.role}</p>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  min={todayDateInputValue()}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1"
                />

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Service
                </label>
                <select
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {serviceOptions.map((option) => (
                    <option
                      key={option.durationMinutes}
                      value={option.durationMinutes}
                    >
                      {formatServiceOptionLabel(
                        option.durationMinutes,
                        option.priceCents,
                        currency,
                      )}
                    </option>
                  ))}
                </select>

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Time
                </label>
                {loadingSlots ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading times…
                  </p>
                ) : slots.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No times available for this day.
                  </p>
                ) : (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setStartsAt(slot)}
                        className={cn(
                          "rounded-lg border py-2 text-sm font-medium transition-colors",
                          startsAt === slot
                            ? isPastel
                              ? "border-[#e91e63] bg-white text-[#e91e63]"
                              : "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background",
                        )}
                      >
                        {formatAmPmTime(buildStartsAtIso(date, slot))}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {priceLabel ? (
                <p className="text-center text-sm text-muted-foreground">
                  Total · <span className="font-semibold text-foreground">{priceLabel}</span>
                </p>
              ) : null}

              <AppButton
                className={primaryButtonClass}
                disabled={!startsAt || !durationMinutes}
                onClick={() => setStep("details")}
              >
                Continue
              </AppButton>
            </>
          ) : null}

          {step === "details" ? (
            <>
              <div className={cardClass}>
                <p className="text-sm font-medium">
                  {formatScheduleDate(startsAtIso!)} ·{" "}
                  {formatAmPmTime(startsAtIso!)} · {priceLabel}
                </p>

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your name
                </label>
                <Input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="mt-1"
                  placeholder="Full name"
                />

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone
                </label>
                <Input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  className="mt-1"
                  placeholder="04xx xxx xxx"
                  inputMode="tel"
                />

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email (optional)
                </label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  className="mt-1"
                  placeholder="you@email.com"
                />

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Postcode (optional)
                </label>
                <Input
                  value={customerPostcode}
                  onChange={(event) => setCustomerPostcode(event.target.value)}
                  className="mt-1"
                  placeholder="2000"
                />
              </div>

              <AppButton
                className={primaryButtonClass}
                disabled={!customerName.trim() || !customerPhone.trim()}
                onClick={() => setStep("payment")}
              >
                Continue to payment
              </AppButton>
            </>
          ) : null}

          {step === "payment" ? (
            <>
              <div className={cardClass}>
                <p className="text-sm text-muted-foreground">
                  Demo payment — no real charge.
                </p>
                <p className="mt-2 text-2xl font-semibold">{priceLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {staff.name} · {formatAmPmTime(startsAtIso!)}
                </p>

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Card number
                </label>
                <Input
                  className="mt-1"
                  defaultValue="4242 4242 4242 4242"
                  readOnly
                />
              </div>

              {error ? (
                <p className="text-center text-sm text-destructive">{error}</p>
              ) : null}

              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitBooking()}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50",
                  isPastel
                    ? "rounded-full border-2 border-[#e91e63] bg-white text-[#e91e63]"
                    : "rounded-xl bg-primary text-primary-foreground",
                )}
              >
                {submitting ? (
                  "Processing…"
                ) : (
                  <>
                    Pay {priceLabel}
                    <Banknote className="size-4" />
                  </>
                )}
              </button>
            </>
          ) : null}

          {step === "done" && booking ? (
            <div className="space-y-4 pt-8 text-center">
              <CheckCircle2
                className={cn(
                  "mx-auto size-14",
                  isPastel ? "text-[#e91e63]" : "text-primary",
                )}
              />
              <div>
                <h2 className="text-xl font-semibold">Booking confirmed</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {booking.staffName} has been notified.
                </p>
              </div>
              <div className={cn(cardClass, "text-left text-sm")}>
                <p className="font-medium">{formatScheduleDate(booking.startsAt)}</p>
                <p className="text-muted-foreground">
                  {formatAmPmTime(booking.startsAt)} – {formatAmPmTime(booking.endsAt)}
                </p>
                <p className="mt-2 font-semibold">
                  {formatPriceFromCents(booking.priceCents, currency)}
                </p>
                {booking.roomName ? (
                  <p className="mt-1 text-muted-foreground">{booking.roomName}</p>
                ) : null}
              </div>
              <Link
                href={returnTo}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center text-sm font-semibold",
                  isPastel
                    ? "rounded-full border-2 border-[#e91e63] bg-white text-[#e91e63]"
                    : "rounded-xl bg-primary text-primary-foreground",
                )}
              >
                Done
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
