"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  DEFAULT_BOOKING_TIMEZONE,
  formatAmPmTime,
  formatScheduleDate,
  formatShiftDateTime,
  isoToDatetimeLocal,
  todayDateInZone,
} from "../../lib/schedule-utils";
import { BookingCustomerDateTimePicker } from "./booking-customer-datetime-picker";
import { StripePaymentForm } from "./stripe-payment-form";
import { StaffPhotoGallery } from "./staff-photo-gallery";
import { bookingCustomerTheme as theme } from "../../lib/booking-customer-theme";
import {
  formatCustomerBookingName,
  isValidCustomerBookingNameParts,
} from "../../lib/customer-booking-name";
import {
  AU_MOBILE_PREFIX,
  formatAuMobileInput,
  formatAuPostcodeInput,
  isValidAuMobile,
  isValidAuPostcode,
  normalizeAuMobile,
} from "../../lib/au-contact";

type Step = "form" | "payment" | "done";

interface BookingCheckoutFlowProps {
  staffId: string;
  returnTo?: string;
}

interface StaffInfo {
  id: string;
  name: string;
  photoUrl: string | null;
  photos?: string[];
  role: string;
  initials?: string;
}

interface SlotOption {
  startsAt: string;
  label: string;
}

interface BookedRow {
  startsAt: string;
  endsAt: string;
  label: string;
  customerName: string | null;
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
  returnTo = "/booking",
}: BookingCheckoutFlowProps) {
  const tenant = useOptionalTenant();
  const timeZone =
    tenant?.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
  const [step, setStep] = useState<Step>("form");
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [currency, setCurrency] = useState("AUD");
  const [bookingDate, setBookingDate] = useState(() =>
    todayDateInZone(timeZone),
  );
  const [durationMinutes, setDurationMinutes] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotsReason, setSlotsReason] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerSecondName, setCustomerSecondName] = useState("");
  const [customerPhone, setCustomerPhone] = useState(AU_MOBILE_PREFIX);
  const [customerPostcode, setCustomerPostcode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formHint, setFormHint] = useState<string | null>(null);
  const [booking, setBooking] = useState<CreatedBooking | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

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
    setBookingDate(todayDateInZone(timeZone));
  }, [timeZone]);

  useEffect(() => {
    if (!durationMinutes || !staffId) {
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
          durationMinutes,
          date: bookingDate,
        });
        const response = await fetch(`/api/booking/availability?${params}`);
        const data = (await response.json()) as {
          slots?: SlotOption[];
          booked?: BookedRow[];
          shiftLabel?: string | null;
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

          const nextSlots = (data.slots ?? []).filter(
            (slot) => new Date(slot.startsAt).getTime() >= Date.now() + 5 * 60_000,
          );
          setSlots(nextSlots);
          // booked + shiftLabel intentionally not shown to customers
          setSlotsReason(data.reason ?? null);
          setStartsAt((current) =>
            current && nextSlots.some((slot) => slot.startsAt === current)
              ? current
              : "",
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
  }, [staffId, durationMinutes, bookingDate]);

  const slotOptions = useMemo(
    () =>
      slots.map((slot) => ({
        value: slot.startsAt,
        label: slot.label,
        groupTime: isoToDatetimeLocal(slot.startsAt, timeZone).slice(11, 16),
      })),
    [slots, timeZone],
  );

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

  const canBook =
    Boolean(startsAt) &&
    Boolean(durationMinutes) &&
    isValidCustomerBookingNameParts(customerFirstName, customerSecondName) &&
    isValidAuMobile(customerPhone) &&
    isValidAuPostcode(customerPostcode);

  const goToPayment = async () => {
    setFormHint(null);
    setError(null);

    if (!startsAt) {
      setFormHint("Please select an available date and time.");
      return;
    }
    if (
      !isValidCustomerBookingNameParts(customerFirstName, customerSecondName)
    ) {
      setFormHint("Enter your first name and second name.");
      return;
    }
    if (!isValidAuMobile(customerPhone)) {
      setFormHint("Enter a valid Australian mobile (04XX XXX XXX).");
      return;
    }
    if (!isValidAuPostcode(customerPostcode)) {
      setFormHint("Enter a valid 4-digit Australian postcode.");
      return;
    }

    const customerName = formatCustomerBookingName(
      customerFirstName,
      customerSecondName,
    );

    setCheckoutLoading(true);

    try {
      const response = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          startsAt,
          durationMinutes: Number(durationMinutes),
          customerName,
          customerPhone: normalizeAuMobile(customerPhone),
          customerPostcode: formatAuPostcodeInput(customerPostcode),
        }),
      });

      const data = (await response.json()) as {
        clientSecret?: string;
        bookingId?: string;
        publishableKey?: string;
        error?: string;
      };

      if (!response.ok || !data.clientSecret || !data.bookingId || !data.publishableKey) {
        throw new Error(data.error ?? "Could not start payment.");
      }

      setClientSecret(data.clientSecret);
      setPublishableKey(data.publishableKey);
      setPendingBookingId(data.bookingId);
      setStep("payment");
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start payment.";
      setError(message);
      setFormHint(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const waitForPaidBooking = async (bookingId: string) => {
    await fetch(`/api/booking/${bookingId}/confirm`, { method: "POST" });

    for (let attempt = 0; attempt < 15; attempt += 1) {
      const response = await fetch(`/api/booking/${bookingId}/status`);
      const data = (await response.json()) as {
        paid?: boolean;
        booking?: CreatedBooking;
      };

      if (response.ok && data.paid && data.booking) {
        setBooking(data.booking);
        setStep("done");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Payment received but confirmation is still processing.");
  };

  const handlePaymentSuccess = async () => {
    if (!pendingBookingId) return;

    setSubmitting(true);
    setError(null);

    try {
      await waitForPaidBooking(pendingBookingId);
    } catch (successError) {
      setError(
        successError instanceof Error
          ? successError.message
          : "Could not confirm booking.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = theme.field;
  const labelClass = theme.label;
  const pillButtonClass = theme.goldButton;

  if (loadingStaff) {
    return (
      <div className={theme.page}>
        <div className="mx-auto flex min-h-svh max-w-md items-center justify-center">
          <div className="size-10 animate-pulse rounded-full bg-stone-100" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className={cn(theme.page, "mx-auto flex max-w-md flex-col items-center justify-center px-6 text-center min-h-svh")}>
        <p className={cn(theme.sectionTitle)}>Open on your spa site</p>
        <p className={cn(theme.bodyMuted, "mt-2")}>
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
      <div className={cn(theme.page, "mx-auto flex max-w-md flex-col items-center justify-center px-6 text-center min-h-svh")}>
        <p className={cn(theme.sectionTitle)}>Staff not found</p>
        <p className={cn(theme.bodyMuted, "mt-2")}>
          This therapist may no longer be available.
        </p>
        <Link href={returnTo} className={cn(pillButtonClass, "mt-6 max-w-xs")}>
          Choose another
        </Link>
      </div>
    );
  }

  return (
    <div className={theme.page}>
      <div className={theme.shell}>
        <header className={theme.headerCompact}>
          {step !== "done" ? (
            <Link
              href={step === "payment" ? "#" : returnTo}
              onClick={(event) => {
                if (step === "payment") {
                  event.preventDefault();
                  setStep("form");
                }
              }}
              className={theme.backButton}
              aria-label="Back"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : (
            <span className="size-9" />
          )}
          <div className="min-w-0 flex-1">
            <p className={theme.eyebrow}>
              {step === "payment"
                ? "Payment"
                : step === "done"
                  ? "Confirmed"
                  : "Book appointment"}
            </p>
            <h1 className={theme.titleCompact}>{staff.name}</h1>
          </div>
        </header>

        <div className="space-y-5 px-4 py-5 pb-10">
          {step === "form" ? (
            <>
              <div className="space-y-3.5 pt-1">
                <StaffPhotoGallery
                  name={staff.name}
                  initials={
                    staff.initials ??
                    staff.name
                      .split(/\s+/)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  }
                  photos={staff.photos ?? []}
                  photoUrl={staff.photoUrl}
                />
                <div className="text-center">
                  <p className={theme.sectionTitle}>{staff.name}</p>
                  <p className={theme.role}>{staff.role}</p>
                </div>
              </div>

              <div className={cn(theme.panel, "space-y-5")}>
                {/* Customer booking should not expose staff shift/booking metadata. */}
                {null}

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

                <BookingCustomerDateTimePicker
                  date={bookingDate}
                  onDateChange={(nextDate) => {
                    setBookingDate(nextDate);
                    setStartsAt("");
                    setFormHint(null);
                    setError(null);
                  }}
                  timeZone={timeZone}
                  durationMinutes={Number(durationMinutes) || 30}
                  slotOptions={slotOptions}
                  selectedValue={startsAt}
                  onSelect={(slotStartsAt) => {
                    setStartsAt(slotStartsAt);
                    setFormHint(null);
                    setError(null);
                  }}
                  loading={loadingSlots}
                  hint={slotsReason}
                  emptyMessage={slotsReason ?? "No times available."}
                />

                {/* Hide staff booking times from customer booking UI. */}
                {null}

                <div className="space-y-1">
                  <label className={labelClass}>Name</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={customerFirstName}
                      onChange={(event) => {
                        setCustomerFirstName(event.target.value);
                        setFormHint(null);
                        setError(null);
                      }}
                      className={fieldClass}
                      placeholder="First Name"
                      autoCapitalize="words"
                      autoComplete="given-name"
                      aria-label="First Name"
                    />
                    <Input
                      value={customerSecondName}
                      onChange={(event) => {
                        setCustomerSecondName(event.target.value);
                        setFormHint(null);
                        setError(null);
                      }}
                      className={fieldClass}
                      placeholder="Second Name"
                      autoCapitalize="words"
                      autoComplete="family-name"
                      aria-label="Second Name"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Phone</label>
                  <Input
                    value={customerPhone}
                    onChange={(event) => {
                      setCustomerPhone(formatAuMobileInput(event.target.value));
                      setFormHint(null);
                      setError(null);
                    }}
                    onBlur={() => {
                      setCustomerPhone((current) =>
                        formatAuMobileInput(current || AU_MOBILE_PREFIX),
                      );
                    }}
                    className={fieldClass}
                    placeholder="04XX XXX XXX"
                    inputMode="tel"
                    autoComplete="tel-national"
                    maxLength={12}
                    aria-label="Australian mobile number"
                  />
                  <p className={cn(theme.helperText, "mt-1 px-0.5")}>
                    Australian mobile — starts with 04
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Post code</label>
                  <Input
                    value={customerPostcode}
                    onChange={(event) => {
                      setCustomerPostcode(
                        formatAuPostcodeInput(event.target.value),
                      );
                      setFormHint(null);
                      setError(null);
                    }}
                    className={fieldClass}
                    placeholder="2000"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={4}
                    aria-label="Australian postcode"
                  />
                  <p className={cn(theme.helperText, "mt-1 px-0.5")}>
                    4-digit Australian postcode
                  </p>
                </div>

                <div className={theme.priceBox}>
                  <p className={theme.priceLabel}>
                    Amount to pay
                  </p>
                  <p className={theme.priceValue}>
                    {priceLabel ?? "—"}
                  </p>
                </div>
              </div>

              {(formHint || error) ? (
                <p className="text-center text-sm font-medium leading-relaxed text-red-600">
                  {formHint ?? error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={checkoutLoading || !canBook}
                onClick={() => void goToPayment()}
                className={cn(pillButtonClass, !canBook && "opacity-60")}
              >
                {checkoutLoading ? "Preparing…" : "Book"}
              </button>
            </>
          ) : null}

          {step === "payment" ? (
            <>
              <div className={cn(theme.panel, "text-center")}>
                <div className="mx-auto max-w-[160px]">
                  <StaffPhotoGallery
                    name={staff.name}
                    initials={
                      staff.initials ??
                      staff.name
                        .split(/\s+/)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    }
                    photos={(staff.photos ?? []).slice(0, 1)}
                    photoUrl={staff.photoUrl}
                  />
                </div>
                <p className={cn(theme.bodyMuted, "mt-3")}>
                  Secure card payment
                </p>
                <p className={theme.priceValueLarge}>{priceLabel}</p>
                <p className={cn(theme.bodyMuted, "mt-1.5")}>
                  {staff.name} · {formatShiftDateTime(startsAt, timeZone)}
                </p>
              </div>

              {error ? (
                <p className="text-center text-sm font-medium leading-relaxed text-destructive">{error}</p>
              ) : null}

              {clientSecret && publishableKey && priceLabel ? (
                <StripePaymentForm
                  clientSecret={clientSecret}
                  publishableKey={publishableKey}
                  amountLabel={priceLabel}
                  disabled={submitting}
                  onSuccess={() => void handlePaymentSuccess()}
                  onError={(message) => setError(message)}
                  buttonClassName={pillButtonClass}
                />
              ) : (
                <p className={cn(theme.bodyMuted, "text-center")}>
                  Loading payment…
                </p>
              )}
            </>
          ) : null}

          {step === "done" && booking ? (
            <div className="space-y-5 pt-8 text-center">
              <CheckCircle2 className={theme.successIcon} />
              <div>
                <h2 className={theme.sectionTitle}>Booking confirmed</h2>
                <p className={cn(theme.bodyMuted, "mt-2")}>
                  {booking.staffName} and admin have been notified.
                </p>
              </div>
              <div className={cn(theme.panel, "space-y-1 text-left text-sm")}>
                <p className="font-semibold text-stone-900">
                  {formatScheduleDate(booking.startsAt)}
                </p>
                <p className="font-normal leading-relaxed text-stone-500">
                  {formatAmPmTime(booking.startsAt)} –{" "}
                  {formatAmPmTime(booking.endsAt)}
                </p>
                <p className="mt-2.5 text-base font-bold tabular-nums text-stone-900">
                  {formatPriceFromCents(booking.priceCents, currency)}
                </p>
                {booking.roomName ? (
                  <p className="mt-1 font-normal text-stone-500">{booking.roomName}</p>
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
