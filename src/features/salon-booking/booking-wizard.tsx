"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BookingStepper,
  BookingSuccess,
  BookingSummary,
  CalendarSelector,
  CustomerForm,
  ServiceSelector,
  StaffSelector,
  TimeSlotSelector,
  type BookingStepId,
  type CustomerFormValue,
} from "@/components/booking";
import { PolicyAcceptancePanel } from "@/features/booking-policy";
import type { ResolvedPolicy } from "@/features/booking-policy/types";
import {
  NO_PREFERENCE_STAFF_ID,
  type BookingSalonContext,
} from "@/features/salon-booking/catalog-types";
import {
  generateAvailableSlots,
  isBookingDateDisabled,
} from "@/features/salon-booking/generateAvailableSlots";
import {
  bookingWizardCopy,
  type BookingUiLocale,
} from "@/features/salon-booking/booking-wizard-copy";
import type {
  ExistingBookingBlock,
  SalonBooking,
  TimeSlot,
} from "@/features/salon-booking/types";

type Step = Exclude<BookingStepId, "done"> | "done";

type BookingWizardProps = {
  context: BookingSalonContext;
  backHref: string;
  locale?: BookingUiLocale;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingWizard({
  context,
  backHref,
  locale = "en",
}: BookingWizardProps) {
  const copy = bookingWizardCopy(locale);
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(NO_PREFERENCE_STAFF_ID);
  const [date, setDate] = useState(todayIso());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerFormValue>({
    firstName: "",
    lastName: "",
    phone: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<SalonBooking | null>(null);
  const [assignedStaffName, setAssignedStaffName] = useState<string>("");
  const [bookingsByStaff, setBookingsByStaff] = useState<
    Record<string, ExistingBookingBlock[]>
  >({});
  const [resolvedPolicy, setResolvedPolicy] = useState<ResolvedPolicy | null>(
    null,
  );
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const service = context.services.find((s) => s.id === serviceId) ?? null;

  const staffForService = useMemo(() => {
    if (!serviceId) return [];
    return context.staff.filter(
      (s) => s.bookingEnabled && s.serviceIds.includes(serviceId),
    );
  }, [context.staff, serviceId]);

  const loadBookings = useCallback(async () => {
    if (!serviceId || !date) return;
    try {
      const params = new URLSearchParams({
        salonId: context.salonId,
        date,
        serviceId,
      });
      if (staffId && staffId !== NO_PREFERENCE_STAFF_ID) {
        params.set("staffId", staffId);
      }
      const res = await fetch(`/api/salon-booking/slots?${params}`);
      const data = (await res.json()) as {
        existingBookingsByStaff?: Record<string, ExistingBookingBlock[]>;
        slots?: TimeSlot[];
        error?: string;
      };
      if (data.existingBookingsByStaff) {
        setBookingsByStaff(data.existingBookingsByStaff);
      }
    } catch {
      // slots still work from empty bookings
    }
  }, [context.salonId, date, serviceId, staffId]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (step !== "summary" || !service) return;
    let cancelled = false;
    setPolicyLoading(true);
    setPolicyAccepted(false);
    void (async () => {
      try {
        const params = new URLSearchParams({
          salonId: context.salonId,
          serviceId: service.id,
          price: String(service.price),
        });
        const res = await fetch(`/api/salon-booking/policy?${params}`);
        const data = (await res.json()) as {
          policy?: ResolvedPolicy;
          error?: string;
        };
        if (!cancelled) {
          setResolvedPolicy(data.policy ?? null);
        }
      } catch {
        if (!cancelled) setResolvedPolicy(null);
      } finally {
        if (!cancelled) setPolicyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, service, context.salonId]);

  const slots = useMemo(() => {
    if (!service) return [];
    return generateAvailableSlots({
      context,
      staffId,
      serviceId: service.id,
      serviceDuration: service.duration,
      date,
      existingBookingsByStaff: bookingsByStaff,
    });
  }, [bookingsByStaff, context, date, service, serviceId, staffId]);

  const selectedSlot = slots.find((s) => s.startTime === startTime) ?? null;

  const staffLabel = useMemo(() => {
    if (assignedStaffName) return assignedStaffName;
    if (!staffId || staffId === NO_PREFERENCE_STAFF_ID) return copy.noPreference;
    return (
      context.staff.find((s) => s.id === staffId)?.displayName ?? copy.labelStaff
    );
  }, [assignedStaffName, context.staff, copy.labelStaff, copy.noPreference, staffId]);

  function goNext() {
    setError(null);
    if (step === "service") {
      if (!serviceId) return setError(copy.chooseService);
      setStaffId(NO_PREFERENCE_STAFF_ID);
      setStartTime(null);
      setStep("staff");
      return;
    }
    if (step === "staff") {
      if (!staffId) return setError(copy.chooseStaff);
      setStartTime(null);
      setStep("date");
      return;
    }
    if (step === "date") {
      if (!date) return setError(copy.chooseDate);
      if (
        serviceId &&
        isBookingDateDisabled({
          context,
          staffId,
          serviceId,
          date,
          todayIso: todayIso(),
        })
      ) {
        return setError(copy.dateUnavailable);
      }
      setStartTime(null);
      setStep("time");
      return;
    }
    if (step === "time") {
      if (!startTime) return setError(copy.chooseTime);
      setStep("customer");
      return;
    }
    if (step === "customer") {
      if (!customer.firstName.trim() || !customer.lastName.trim()) {
        return setError(copy.nameRequired);
      }
      if (!customer.phone.trim()) return setError(copy.phoneRequired);
      setStep("summary");
    }
  }

  function goBack() {
    setError(null);
    if (step === "staff") setStep("service");
    else if (step === "date") setStep("staff");
    else if (step === "time") setStep("date");
    else if (step === "customer") setStep("time");
    else if (step === "summary") setStep("customer");
  }

  async function confirmBooking() {
    if (!service || !startTime || !selectedSlot) return;
    if (!policyAccepted) {
      setError(copy.acceptPolicy);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/salon-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: context.salonId,
          slug: context.slug,
          serviceId: service.id,
          staffId,
          bookingDate: date,
          startTime,
          policyAccepted: true,
          customer: {
            firstName: customer.firstName.trim(),
            lastName: customer.lastName.trim(),
            phone: customer.phone.trim(),
            notes: customer.notes.trim(),
          },
        }),
      });
      const data = (await res.json()) as {
        booking?: SalonBooking;
        staffName?: string;
        error?: string;
      };
      if (!res.ok || !data.booking) {
        throw new Error(data.error || copy.bookFailed);
      }
      setCreated(data.booking);
      setAssignedStaffName(data.staffName ?? staffLabel);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.bookFailed);
    } finally {
      setSubmitting(false);
    }
  }

  const customerName = `${customer.firstName} ${customer.lastName}`.trim();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="text-[13px] font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          ← {copy.backToSalon.replace(/^←\s*/, "")}
        </Link>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          {copy.book}
        </p>
      </div>

      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          {context.salonName}
        </h1>
        <p className="text-[15px] text-neutral-600">
          {copy.intro}
        </p>
      </header>

      {step !== "done" ? (
        <div className="mb-8">
          <BookingStepper steps={copy.steps} current={step} />
        </div>
      ) : null}

      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] sm:p-7">
        {step === "service" ? (
          <section className="space-y-4">
            <h2 className="text-[18px] font-semibold text-neutral-950">
              {copy.selectService}
            </h2>
            <ServiceSelector
              services={context.services}
              value={serviceId}
              onChange={setServiceId}
              emptyLabel={copy.noServices}
            />
          </section>
        ) : null}

        {step === "staff" ? (
          <section className="space-y-4">
            <h2 className="text-[18px] font-semibold text-neutral-950">
              {copy.selectStaff}
            </h2>
            {staffForService.length === 0 ? (
              <p className="text-[14px] text-neutral-500">{copy.noStaff}</p>
            ) : (
              <StaffSelector
                staff={staffForService}
                value={staffId}
                onChange={setStaffId}
                noPreferenceLabel={copy.noPreference}
                noPreferenceHint={copy.noPreferenceHint}
                anyLabel={copy.any}
              />
            )}
          </section>
        ) : null}

        {step === "date" && serviceId ? (
          <section className="space-y-4">
            <h2 className="text-[18px] font-semibold text-neutral-950">
              {copy.selectDate}
            </h2>
            <CalendarSelector
              value={date}
              onChange={(next) => {
                setDate(next);
                setStartTime(null);
              }}
              isDisabled={(iso) =>
                isBookingDateDisabled({
                  context,
                  staffId,
                  serviceId,
                  date: iso,
                  todayIso: todayIso(),
                })
              }
            />
          </section>
        ) : null}

        {step === "time" ? (
          <section className="space-y-4">
            <h2 className="text-[18px] font-semibold text-neutral-950">
              {copy.selectTime}
            </h2>
            <p className="text-[13px] text-neutral-500">
              {staffLabel} · {service?.duration} {copy.minutes}
            </p>
            <TimeSlotSelector
              slots={slots}
              value={startTime}
              onChange={setStartTime}
              emptyLabel={copy.noTimes}
            />
          </section>
        ) : null}

        {step === "customer" ? (
          <section className="space-y-4">
            <h2 className="text-[18px] font-semibold text-neutral-950">
              {copy.yourDetails}
            </h2>
            <CustomerForm
              value={customer}
              onChange={setCustomer}
              labels={{
                firstName: copy.firstName,
                lastName: copy.lastName,
                phone: copy.phone,
                notes: copy.notes,
              }}
            />
          </section>
        ) : null}

        {step === "summary" && service && selectedSlot ? (
          <section className="space-y-5">
            <h2 className="text-[18px] font-semibold text-neutral-950">
              {copy.summary}
            </h2>
            <BookingSummary
              salonName={context.salonName}
              serviceName={service.name}
              staffName={staffLabel}
              date={date}
              startTime={selectedSlot.startTime}
              endTime={selectedSlot.endTime}
              duration={service.duration}
              priceLabel={service.priceLabel}
              customerName={customerName}
              customerPhone={customer.phone}
              dateLocale={copy.dateLocale}
              labels={{
                title: copy.summaryTitle,
                service: copy.labelService,
                staff: copy.labelStaff,
                date: copy.labelDate,
                time: copy.labelTime,
                duration: copy.labelDuration,
                price: copy.labelPrice,
                name: copy.labelName,
                email: copy.labelEmail,
                phone: copy.labelPhone,
                durationUnit: copy.minutes,
              }}
              confirmationNote={
                resolvedPolicy?.instantConfirmation
                  ? copy.confirmInstant
                  : copy.confirmPending
              }
            />
            <PolicyAcceptancePanel
              policy={resolvedPolicy}
              loading={policyLoading}
              accepted={policyAccepted}
              onAcceptedChange={setPolicyAccepted}
              copy={{
                loading: copy.loadingPolicies,
                policies: copy.policies,
                bookingPolicy: copy.bookingPolicy,
                cancellationPolicy: copy.cancellationPolicy,
                depositPolicy: copy.depositPolicy,
                refundPolicy: copy.refundPolicy,
                noShowPolicy: copy.noShowPolicy,
                accept: copy.acceptPolicies,
              }}
            />
          </section>
        ) : null}

        {step === "done" && created && service ? (
          <BookingSuccess
            salonName={context.salonName}
            serviceName={service.name}
            staffName={assignedStaffName || staffLabel}
            date={created.bookingDate}
            startTime={created.startTime}
            endTime={created.endTime}
            duration={created.duration}
            priceLabel={service.priceLabel}
            customerName={created.customerName}
            customerPhone={created.customerPhone}
            status={created.status}
            bookingId={created.id}
            backHref={backHref}
            dateLocale={copy.dateLocale}
            copy={{
              title: copy.successTitle,
              status: copy.status,
              done: copy.done,
            }}
            summaryLabels={{
              title: copy.summaryTitle,
              service: copy.labelService,
              staff: copy.labelStaff,
              date: copy.labelDate,
              time: copy.labelTime,
              duration: copy.labelDuration,
              price: copy.labelPrice,
              name: copy.labelName,
              email: copy.labelEmail,
              phone: copy.labelPhone,
              durationUnit: copy.minutes,
            }}
          />
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
                {copy.back}
              </button>
            ) : null}
            {step !== "summary" ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white"
              >
                {copy.continue}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void confirmBooking()}
                disabled={submitting || !policyAccepted}
                className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {submitting ? copy.confirming : copy.confirmBooking}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
