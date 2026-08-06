"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  BookingSummary,
  DateSelector,
  ServiceSelector,
  StaffSelector,
  TimeSlotGrid,
} from "@/components/booking";
import {
  createBooking,
  BookingConflictError,
  BookingValidationError,
} from "@/features/salon-booking/createBooking";
import { generateTimeSlots } from "@/features/salon-booking/generateTimeSlots";
import {
  buildStaffAvailabilityInput,
  type BookingSalonContext,
} from "@/features/salon-booking/mock-context";
import { createMemorySalonBookingsRepository } from "@/features/salon-booking/repositories/memory";
import type { SalonBooking } from "@/features/salon-booking/types";
import { getDayOfWeekMondayFirst } from "@/features/salon-booking/time-utils";
import { cn } from "@/lib/utils";

type Step =
  | "service"
  | "staff"
  | "datetime"
  | "customer"
  | "summary"
  | "done";

type BookingWizardProps = {
  context: BookingSalonContext;
  backHref: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingWizard({ context, backHref }: BookingWizardProps) {
  const [repo] = useState(() => createMemorySalonBookingsRepository());
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(todayIso());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<SalonBooking | null>(null);

  const service = context.services.find((s) => s.id === serviceId) ?? null;

  const staffForService = useMemo(() => {
    if (!serviceId) return [];
    return context.staff.filter(
      (s) => s.bookingEnabled && s.serviceIds.includes(serviceId),
    );
  }, [context.staff, serviceId]);

  const staff = context.staff.find((s) => s.id === staffId) ?? null;

  const availabilityInput = useMemo(() => {
    if (!staffId || !service) return null;
    return buildStaffAvailabilityInput({
      context,
      staffId,
      serviceDuration: service.duration,
      date,
    });
  }, [context, staffId, service, date]);

  const slots = useMemo(() => {
    if (!availabilityInput) return [];
    return generateTimeSlots(availabilityInput);
  }, [availabilityInput]);

  const selectedSlot = slots.find((s) => s.startTime === startTime) ?? null;

  const steps: { id: Step; label: string }[] = [
    { id: "service", label: "Service" },
    { id: "staff", label: "Staff" },
    { id: "datetime", label: "Date & time" },
    { id: "customer", label: "Details" },
    { id: "summary", label: "Confirm" },
  ];

  function goNext() {
    setError(null);
    if (step === "service") {
      if (!serviceId) return setError("Choose a service.");
      setStaffId(null);
      setStartTime(null);
      setStep("staff");
      return;
    }
    if (step === "staff") {
      if (!staffId) return setError("Choose a staff member.");
      setStartTime(null);
      setStep("datetime");
      return;
    }
    if (step === "datetime") {
      if (!date || !startTime) return setError("Choose a date and time.");
      setStep("customer");
      return;
    }
    if (step === "customer") {
      if (!customerName.trim()) return setError("Name is required.");
      setStep("summary");
    }
  }

  function goBack() {
    setError(null);
    if (step === "staff") setStep("service");
    else if (step === "datetime") setStep("staff");
    else if (step === "customer") setStep("datetime");
    else if (step === "summary") setStep("customer");
  }

  async function confirmBooking() {
    if (!service || !staff || !startTime || !availabilityInput) return;
    setSubmitting(true);
    setError(null);
    try {
      const booking = await createBooking(repo, {
        salonId: context.salonId,
        staffId: staff.id,
        serviceId: service.id,
        bookingDate: date,
        startTime,
        duration: service.duration,
        bufferMinutes: staff.bufferMinutes,
        customerName,
        customerEmail,
        customerPhone,
        notes,
        status: "pending",
        availability: availabilityInput,
      });
      setCreated(booking);
      setStep("done");
    } catch (err) {
      if (
        err instanceof BookingConflictError ||
        err instanceof BookingValidationError
      ) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Could not book.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="text-[13px] font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          ← Back to salon
        </Link>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Book
        </p>
      </div>

      <header className="mb-8 space-y-2">
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
          {context.salonName}
        </h1>
        <p className="text-[15px] text-neutral-600">
          Choose your service, stylist, and time — slots respect hours, breaks,
          leave, and buffers.
        </p>
      </header>

      {step !== "done" ? (
        <div className="mb-8 flex gap-2 overflow-x-auto">
          {steps.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-semibold",
                index <= stepIndex
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-500",
              )}
            >
              {index + 1}. {item.label}
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] sm:p-7">
        {step === "service" ? (
          <section className="space-y-4">
            <h2 className="text-[18px] font-semibold text-neutral-950">
              Choose a service
            </h2>
            <ServiceSelector
              services={context.services}
              value={serviceId}
              onChange={setServiceId}
            />
          </section>
        ) : null}

        {step === "staff" ? (
          <section className="space-y-4">
            <h2 className="text-[18px] font-semibold text-neutral-950">
              Choose staff
            </h2>
            {staffForService.length === 0 ? (
              <p className="text-[14px] text-neutral-500">
                No bookable staff for this service yet.
              </p>
            ) : (
              <StaffSelector
                staff={staffForService}
                value={staffId}
                onChange={setStaffId}
              />
            )}
          </section>
        ) : null}

        {step === "datetime" ? (
          <section className="space-y-6">
            <div>
              <h2 className="text-[18px] font-semibold text-neutral-950">
                Choose a date
              </h2>
              <div className="mt-4">
                <DateSelector
                  value={date}
                  onChange={(next) => {
                    setDate(next);
                    setStartTime(null);
                  }}
                />
              </div>
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-neutral-950">
                Available times
              </h2>
              <p className="mt-1 text-[13px] text-neutral-500">
                {staff?.displayName} · {service?.duration} min · buffer{" "}
                {staff?.bufferMinutes ?? 0} min
                {getDayOfWeekMondayFirst(date) === 0 &&
                staffId === "staff_emma"
                  ? " · demo booking 09:30–10:30 on Mondays"
                  : ""}
              </p>
              <div className="mt-4">
                <TimeSlotGrid
                  slots={slots}
                  value={startTime}
                  onChange={setStartTime}
                />
              </div>
            </div>
          </section>
        ) : null}

        {step === "customer" ? (
          <section className="space-y-4">
            <h2 className="text-[18px] font-semibold text-neutral-950">
              Your details
            </h2>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
                Full name *
              </span>
              <input
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-[14px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
                Email
              </span>
              <input
                type="email"
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-[14px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
                Phone
              </span>
              <input
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-[14px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
                Notes
              </span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </section>
        ) : null}

        {step === "summary" && service && staff && selectedSlot ? (
          <section className="space-y-5">
            <BookingSummary
              salonName={context.salonName}
              serviceName={service.name}
              staffName={staff.displayName}
              date={date}
              startTime={selectedSlot.startTime}
              endTime={selectedSlot.endTime}
              duration={service.duration}
              priceLabel={service.priceLabel}
              customerName={customerName}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
            />
          </section>
        ) : null}

        {step === "done" && created && service && staff ? (
          <section className="space-y-5 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              ✓
            </div>
            <h2 className="text-[22px] font-semibold text-neutral-950">
              Booking requested
            </h2>
            <p className="text-[14px] text-neutral-600">
              Status: <strong>{created.status}</strong> · Ref{" "}
              <span className="font-mono text-[13px]">{created.id}</span>
            </p>
            <BookingSummary
              salonName={context.salonName}
              serviceName={service.name}
              staffName={staff.displayName}
              date={created.bookingDate}
              startTime={created.startTime}
              endTime={created.endTime}
              duration={created.duration}
              priceLabel={service.priceLabel}
              customerName={created.customerName}
              customerEmail={created.customerEmail}
              customerPhone={created.customerPhone}
            />
            <Link
              href={backHref}
              className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white"
            >
              Done
            </Link>
          </section>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        {step !== "done" ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {step !== "service" ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-[13px] font-semibold text-neutral-800"
              >
                Back
              </button>
            ) : null}
            {step !== "summary" ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={confirmBooking}
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Booking…" : "Confirm booking"}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
