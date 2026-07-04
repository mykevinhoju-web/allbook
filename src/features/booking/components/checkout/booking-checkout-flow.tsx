"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft } from "lucide-react";

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
  nextWorkingDateInputValue,
  todayDateInputValue,
} from "../../lib/schedule-utils";

type Step = "form" | "payment" | "done";

interface BookingCheckoutFlowProps {
  staffId: string;
  returnTo?: string;
}

interface StaffInfo {
  id: string;
  name: string;
  photoUrl: string | null;
  role: string;
  initials?: string;
  workingDays?: string[];
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

function StaffAvatar({ staff }: { staff: StaffInfo }) {
  const [imageError, setImageError] = useState(false);
  const initials =
    staff.initials ??
    staff.name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="mx-auto size-28 overflow-hidden rounded-full bg-rose-50 ring-4 ring-white shadow-md shadow-rose-100/50">
      {imageError || !staff.photoUrl ? (
        <div className="flex size-full items-center justify-center text-xl font-semibold text-rose-500">
          {initials}
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={staff.photoUrl}
          alt={staff.name}
          className="size-full object-cover object-top"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

function DateField({
  value,
  min,
  onChange,
}: {
  value: string;
  min: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
      input.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      className="relative mt-1 flex h-11 w-full cursor-pointer items-center rounded-xl border border-pink-200 bg-white px-3 text-left text-sm text-stone-800"
    >
      <span className={value ? "text-stone-800" : "text-stone-400"}>
        {value
          ? formatScheduleDate(buildStartsAtIso(value, "12:00"))
          : "Select date"}
      </span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Select date"
      />
    </div>
  );
}

export function BookingCheckoutFlow({
  staffId,
  returnTo = "/booking",
}: BookingCheckoutFlowProps) {
  const tenant = useOptionalTenant();

  const [step, setStep] = useState<Step>("form");
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [currency, setCurrency] = useState("AUD");
  const [date, setDate] = useState(todayDateInputValue());
  const [durationMinutes, setDurationMinutes] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsReason, setSlotsReason] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPostcode, setCustomerPostcode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formHint, setFormHint] = useState<string | null>(null);
  const [booking, setBooking] = useState<CreatedBooking | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoadingStaff(true);
      try {
        const [staffRes, servicesRes] = await Promise.all([
          fetch("/api/booking/staff"),
          fetch("/api/service-options"),
        ]);

        if (staffRes.ok) {
          const staffData = (await staffRes.json()) as {
            staff?: StaffInfo[];
            currency?: string;
          };
          const member =
            staffData.staff?.find((row) => row.id === staffId) ?? null;
          if (!cancelled) {
            setStaff(member);
            if (staffData.currency) setCurrency(staffData.currency);
            if (member?.workingDays) {
              setDate(nextWorkingDateInputValue(member.workingDays));
            }
          }
        }

        if (servicesRes.ok) {
          const servicesData = (await servicesRes.json()) as {
            options?: ServiceOption[];
            currency?: string;
          };
          if (!cancelled) {
            const options = servicesData.options ?? [];
            setServiceOptions(options);
            if (servicesData.currency) setCurrency(servicesData.currency);
            if (options[0]) {
              setDurationMinutes(String(options[0].durationMinutes));
            }
          }
        }
      } finally {
        if (!cancelled) setLoadingStaff(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [staffId]);

  useEffect(() => {
    if (!durationMinutes || !staffId || !date) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    setSlotsReason(null);

    void (async () => {
      try {
        const params = new URLSearchParams({
          staffId,
          date,
          durationMinutes,
        });
        const response = await fetch(`/api/booking/availability?${params}`);
        const data = (await response.json()) as {
          slots?: string[];
          reason?: string | null;
          error?: string;
        };

        if (!cancelled) {
          if (!response.ok) {
            setSlots([]);
            setSlotsReason(data.error ?? "Could not load times.");
            setStartsAt("");
            return;
          }

          setSlots(data.slots ?? []);
          setSlotsReason(data.reason ?? null);
          setStartsAt((current) =>
            current && data.slots?.includes(current) ? current : "",
          );
        }
      } catch {
        if (!cancelled) {
          setSlots([]);
          setSlotsReason("Could not load times.");
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [staffId, date, durationMinutes]);

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

  const canBook =
    Boolean(startsAt) &&
    Boolean(durationMinutes) &&
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0;

  const goToPayment = () => {
    setFormHint(null);

    if (!startsAt) {
      setFormHint("Please select an available time.");
      return;
    }
    if (!customerName.trim()) {
      setFormHint("Please enter your name.");
      return;
    }
    if (!customerPhone.trim()) {
      setFormHint("Please enter your phone number.");
      return;
    }

    setStep("payment");
  };

  const submitBooking = async () => {
    if (!startsAtIso || !durationMinutes) {
      setError("Missing appointment details.");
      return;
    }

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
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerPostcode: customerPostcode.trim() || undefined,
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

  const fieldClass =
    "mt-1 h-11 w-full rounded-xl border border-pink-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-[#e91e63]";
  const labelClass =
    "block text-xs font-semibold uppercase tracking-wider text-[#e91e63]/80";
  const pillButtonClass =
    "inline-flex h-11 w-full items-center justify-center rounded-full border-2 border-[#e91e63] bg-white text-sm font-semibold text-[#e91e63] transition-all active:scale-[0.98] disabled:opacity-40";

  if (loadingStaff) {
    return (
      <div className="min-h-svh bg-[#fce4ec]">
        <div className="mx-auto flex min-h-svh max-w-md items-center justify-center">
          <div className="size-10 animate-pulse rounded-full bg-white/70" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center bg-[#fce4ec] px-6 text-center">
        <p className="text-lg font-semibold text-stone-800">Open on your spa site</p>
        <p className="mt-2 text-sm text-stone-500">
          Booking requires a tenant subdomain (e.g. dayspa.allbook.com.au).
        </p>
        <Link href={returnTo} className={cn(pillButtonClass, "mt-6 max-w-xs")}>
          Back
        </Link>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center bg-[#fce4ec] px-6 text-center">
        <p className="text-lg font-semibold text-stone-800">Staff not found</p>
        <p className="mt-2 text-sm text-stone-500">
          This therapist may no longer be available.
        </p>
        <Link href={returnTo} className={cn(pillButtonClass, "mt-6 max-w-xs")}>
          Choose another
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-[#fce4ec] text-stone-800">
      <div className="mx-auto min-h-svh max-w-md border-pink-200/60 md:border-x">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-pink-200/80 bg-[#fce4ec]/95 px-4 py-3 backdrop-blur-md">
          {step !== "done" ? (
            <Link
              href={step === "payment" ? "#" : returnTo}
              onClick={(event) => {
                if (step === "payment") {
                  event.preventDefault();
                  setStep("form");
                }
              }}
              className="flex size-9 items-center justify-center rounded-full text-[#e91e63]"
              aria-label="Back"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : (
            <span className="size-9" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#e91e63]">
              {step === "payment"
                ? "Payment"
                : step === "done"
                  ? "Confirmed"
                  : "Book appointment"}
            </p>
            <h1 className="truncate text-base font-semibold">{staff.name}</h1>
          </div>
        </header>

        <div className="space-y-4 px-4 py-4 pb-10">
          {step === "form" ? (
            <>
              <div className="pt-2 text-center">
                <StaffAvatar staff={staff} />
                <p className="mt-3 text-lg font-semibold">{staff.name}</p>
                <p className="text-xs text-[#e91e63]/70">{staff.role}</p>
              </div>

              <div className="space-y-4 rounded-2xl border border-pink-200/80 bg-white/70 p-4">
                <div>
                  <label className={labelClass}>Date</label>
                  <DateField
                    value={date}
                    min={todayDateInputValue()}
                    onChange={(nextDate) => {
                      setDate(nextDate);
                      setStartsAt("");
                      setFormHint(null);
                    }}
                  />
                </div>

                <div>
                  <label className={labelClass}>Service time</label>
                  <select
                    value={durationMinutes}
                    onChange={(event) => {
                      setDurationMinutes(event.target.value);
                      setStartsAt("");
                      setFormHint(null);
                    }}
                    className={fieldClass}
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
                </div>

                <div>
                  <label className={labelClass}>Available times</label>
                  {loadingSlots ? (
                    <p className="mt-2 text-sm text-stone-400">Loading times…</p>
                  ) : slots.length === 0 ? (
                    <p className="mt-2 text-sm text-stone-400">
                      {slotsReason ?? "No times available for this day."}
                    </p>
                  ) : (
                    <select
                      value={startsAt}
                      onChange={(event) => {
                        setStartsAt(event.target.value);
                        setFormHint(null);
                      }}
                      className={fieldClass}
                    >
                      <option value="">Select a time</option>
                      {slots.map((slot) => (
                        <option key={slot} value={slot}>
                          {formatAmPmTime(buildStartsAtIso(date, slot))}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Name</label>
                  <Input
                    value={customerName}
                    onChange={(event) => {
                      setCustomerName(event.target.value);
                      setFormHint(null);
                    }}
                    className={fieldClass}
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone</label>
                  <Input
                    value={customerPhone}
                    onChange={(event) => {
                      setCustomerPhone(event.target.value);
                      setFormHint(null);
                    }}
                    className={fieldClass}
                    placeholder="04xx xxx xxx"
                    inputMode="tel"
                  />
                </div>

                <div>
                  <label className={labelClass}>Post code</label>
                  <Input
                    value={customerPostcode}
                    onChange={(event) => setCustomerPostcode(event.target.value)}
                    className={fieldClass}
                    placeholder="2000"
                  />
                </div>

                <div className="rounded-xl bg-rose-50/80 px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#e91e63]/80">
                    Amount to pay
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-stone-800">
                    {priceLabel ?? "—"}
                  </p>
                </div>
              </div>

              {formHint ? (
                <p className="text-center text-sm text-rose-600">{formHint}</p>
              ) : null}

              <button
                type="button"
                onClick={goToPayment}
                className={cn(
                  pillButtonClass,
                  !canBook && "opacity-60",
                )}
              >
                Book
              </button>
            </>
          ) : null}

          {step === "payment" ? (
            <>
              <div className="rounded-2xl border border-pink-200/80 bg-white/70 p-4 text-center">
                <StaffAvatar staff={staff} />
                <p className="mt-3 text-sm text-stone-500">Demo payment — no real charge</p>
                <p className="mt-2 text-3xl font-semibold">{priceLabel}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {staff.name} · {formatScheduleDate(startsAtIso!)} ·{" "}
                  {formatAmPmTime(startsAtIso!)}
                </p>

                <label className={cn(labelClass, "mt-5 text-left")}>
                  Card number
                </label>
                <Input
                  className={fieldClass}
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
                className={pillButtonClass}
              >
                {submitting ? "Processing…" : `Pay ${priceLabel}`}
              </button>
            </>
          ) : null}

          {step === "done" && booking ? (
            <div className="space-y-4 pt-8 text-center">
              <CheckCircle2 className="mx-auto size-14 text-[#e91e63]" />
              <div>
                <h2 className="text-xl font-semibold">Booking confirmed</h2>
                <p className="mt-2 text-sm text-stone-500">
                  {booking.staffName} and admin have been notified.
                </p>
              </div>
              <div className="rounded-2xl border border-pink-200/80 bg-white/70 p-4 text-left text-sm">
                <p className="font-medium">{formatScheduleDate(booking.startsAt)}</p>
                <p className="text-stone-500">
                  {formatAmPmTime(booking.startsAt)} –{" "}
                  {formatAmPmTime(booking.endsAt)}
                </p>
                <p className="mt-2 font-semibold">
                  {formatPriceFromCents(booking.priceCents, currency)}
                </p>
                {booking.roomName ? (
                  <p className="mt-1 text-stone-500">{booking.roomName}</p>
                ) : null}
              </div>
              <Link href={returnTo} className={pillButtonClass}>
                Done
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
