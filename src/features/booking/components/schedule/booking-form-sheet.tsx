"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  formatPriceFromCents,
  formatServiceOptionLabel,
} from "@/features/services";
import type { ServiceOption } from "@/features/services";
import {
  applyPricingAdjustments,
  DEFAULT_PRICING_ADJUSTMENTS,
  type PricingAdjustments,
} from "@/features/services/lib/pricing-adjustments";
import type { InternalPaymentMethod } from "@/features/booking/lib/internal-payment-method";
import { paymentMethodForPricing } from "@/features/booking/lib/internal-payment-method";
import {
  AU_MOBILE_PREFIX,
  AU_POSTCODE_PREFIX,
  formatAuMobileInput,
  formatAuPostcodeInput,
  isValidAuMobile,
  normalizeAuMobile,
} from "@/features/booking/lib/au-contact";
import { toast } from "@/components/common";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";

import { bookingCustomerTheme as theme } from "../../lib/booking-customer-theme";
import {
  adminBookingSheetBodyClassName,
  adminBookingSheetClassName,
  adminBookingSheetHandleClassName,
  adminBookingSheetScrollClassName,
} from "../../lib/admin-booking-sheet";
import {
  ANY_GIRL_LABEL,
  ANY_GIRL_SENTINEL,
  OTHER_STAFF_SENTINEL,
} from "../../lib/booking-other-staff";
import { pickWalkInStaff } from "../../lib/walk-in-rotation";
import {
  buildStartsAtIso,
  formatAmPmTime,
  isIsoDateTime,
  datetimeLocalToIso,
  toDatetimeLocalValue,
  todayDateInZone,
} from "../../lib/schedule-utils";
import { BookingCustomerDateTimePicker } from "../checkout/booking-customer-datetime-picker";
import { BookingCustomerContactFields } from "../checkout/booking-customer-contact-fields";

/** Switch to searchable scroll list once the chip grid would get tall. */
const STAFF_CHIP_SEARCH_MIN = 8;

export interface BookingFormValues {
  staffId: string;
  startsAt: string;
  durationMinutes: string;
  roomId: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerPostcode: string;
  paymentMethod: InternalPaymentMethod | "";
  /** Dollars input for Split cash portion (converted on submit). */
  splitCashAmount: string;
  /** Special admin-only action: allow starting immediately (not 5-min step). */
  allowImmediateStart: boolean;
  /** Off-site service — no treatment room. */
  outCall: boolean;
  /** Walk-in vs regular booking — must be chosen before save. */
  walkIn: boolean | null;
  /** External staff name when staffId is OTHER_STAFF_SENTINEL. */
  otherStaffName: string;
  /** Any Girl sentinel or a real staff id not on today's booking chips. */
  otherStaffMemberId: string;
}

export const defaultBookingFormValues: BookingFormValues = {
  staffId: "",
  startsAt: "",
  durationMinutes: "",
  roomId: "",
  customerFirstName: "",
  customerLastName: "",
  customerPhone: AU_MOBILE_PREFIX,
  customerPostcode: AU_POSTCODE_PREFIX,
  paymentMethod: "",
  splitCashAmount: "",
  allowImmediateStart: false,
  outCall: false,
  walkIn: null,
  otherStaffName: "",
  otherStaffMemberId: "",
};

export interface BookingTimeSlotOption {
  /** ISO start time from the API, or HH:MM for legacy static options. */
  value: string;
  label: string;
  /** HH:MM used for hour grouping when value is an ISO timestamp. */
  groupTime?: string;
  /** First room that would be auto-assigned at this time. */
  suggestedRoomName?: string;
}

interface BookingFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  date: string;
  onDateChange?: (date: string) => void;
  staffOptions: { id: string; name: string }[];
  /** Active staff not shown on today's booking chips. */
  otherStaffOptions?: { id: string; name: string }[];
  serviceOptions: ServiceOption[];
  pricingAdjustments?: PricingAdjustments;
  currency?: string;
  /** @deprecated Prefer timeSlotOptions (staff availability slots). */
  timeOptions?: string[];
  /** Available start times for the selected staff (and room, if set). */
  timeSlotOptions?: BookingTimeSlotOption[];
  timeSlotsLoading?: boolean;
  timeSlotsHint?: string | null;
  suggestedAutoRoomName?: string | null;
  timeZone: string;
  values: BookingFormValues;
  onChange: (values: BookingFormValues) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className={theme.label}>
      {children}
      {required ? <span className="text-red-600"> *</span> : null}
    </span>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="block space-y-1">
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
    </div>
  );
}

function StaffPicker({
  options,
  value,
  nextStaffId,
  onSelect,
}: {
  options: { id: string; name: string }[];
  value: string;
  nextStaffId?: string | null;
  onSelect: (staffId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const withExtra = useMemo(
    () => [
      ...options,
      { id: OTHER_STAFF_SENTINEL, name: "Other Staff" },
    ],
    [options],
  );
  const showSearch = withExtra.length > STAFF_CHIP_SEARCH_MIN;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return withExtra;
    return withExtra.filter((member) => member.name.toLowerCase().includes(q));
  }, [withExtra, query]);

  return (
    <div className="space-y-2">
      {showSearch ? (
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search staff…"
          className="h-11 rounded-xl border-stone-200 bg-white"
          autoComplete="off"
        />
      ) : null}
      <div
        className={cn(
          "grid grid-cols-2 gap-2",
          showSearch && "max-h-56 overflow-y-auto pr-0.5",
        )}
      >
        {filtered.length === 0 ? (
          <p className="col-span-2 px-1 py-3 text-sm text-stone-500">No match.</p>
        ) : (
          filtered.map((member) => {
            const selected = value === member.id;
            const isNext = Boolean(nextStaffId) && member.id === nextStaffId;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelect(member.id)}
                className={cn(
                  "flex min-h-11 items-center rounded-xl border px-3 py-2.5 text-left transition",
                  selected
                    ? "border-[#8A6A3A] bg-[#8A6A3A]/10 text-stone-900 ring-2 ring-[#8A6A3A]/25"
                    : "border-stone-200 bg-white text-stone-700 active:bg-stone-50",
                )}
              >
                <span
                  className={cn(
                    "truncate text-sm font-semibold",
                    isNext && "text-blue-600",
                  )}
                >
                  {member.name}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export function BookingFormSheet({
  open,
  onOpenChange,
  title = "New booking",
  date,
  onDateChange,
  staffOptions,
  otherStaffOptions = [],
  serviceOptions,
  pricingAdjustments = DEFAULT_PRICING_ADJUSTMENTS,
  currency = "AUD",
  timeOptions = [],
  timeSlotOptions,
  timeSlotsLoading = false,
  timeSlotsHint = null,
  suggestedAutoRoomName = null,
  timeZone,
  values,
  onChange,
  onSubmit,
  submitting = false,
}: BookingFormSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef(values);
  const lastLookupPhoneRef = useRef<string>("");
  const [phoneLookingUp, setPhoneLookingUp] = useState(false);
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [customerRating, setCustomerRating] = useState<"good" | "bad" | null>(
    null,
  );
  const [nextRotationStaffId, setNextRotationStaffId] = useState<string | null>(
    null,
  );
  valuesRef.current = values;

  useEffect(() => {
    if (!open) {
      setNextRotationStaffId(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetchAdminApi("/api/admin/rotation");
        const data = (await response.json()) as {
          rotation?: {
            staffId: string;
            sortOrder: number;
            inService: boolean;
            walkInCount: number;
          }[];
        };
        if (cancelled || !response.ok) return;
        const rotation = data.rotation ?? [];
        const nextId = pickWalkInStaff({
          rotation: rotation.map((row) => ({
            staffId: row.staffId,
            sortOrder: row.sortOrder,
          })),
          walkInCounts: Object.fromEntries(
            rotation.map((row) => [row.staffId, row.walkInCount]),
          ),
          inServiceIds: rotation
            .filter((row) => row.inService)
            .map((row) => row.staffId),
          slotBusyIds: [],
        });
        if (!cancelled) setNextRotationStaffId(nextId);
      } catch {
        if (!cancelled) setNextRotationStaffId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Always start at the top so Staff / Service are reachable on mobile.
    const id = window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0 });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) {
      lastLookupPhoneRef.current = "";
      setPhoneHint(null);
      setCustomerRating(null);
      setPhoneLookingUp(false);
    }
  }, [open]);

  // Any previously saved phone: lookup and autofill name / postcode / email.
  useEffect(() => {
    if (!open) return;
    const phone = values.customerPhone;
    if (!isValidAuMobile(phone)) {
      setPhoneHint(null);
      setCustomerRating(null);
      setPhoneLookingUp(false);
      return;
    }

    const normalized = normalizeAuMobile(phone);
    if (lastLookupPhoneRef.current === normalized) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPhoneLookingUp(true);
      void (async () => {
        try {
          const response = await fetchAdminApi(
            `/api/admin/customers/lookup?phone=${encodeURIComponent(normalized)}`,
          );
          const data = (await response.json()) as {
            customer?: {
              firstName: string;
              secondName: string;
              email: string | null;
              postcode: string | null;
              name: string | null;
              rating?: "good" | "bad" | null;
            } | null;
          };

          if (cancelled) return;
          lastLookupPhoneRef.current = normalized;

          if (!response.ok || !data.customer) {
            setPhoneHint(null);
            setCustomerRating(null);
            return;
          }

          const guest = data.customer;
          const current = valuesRef.current;
          // Skip if the user already moved on to a different phone.
          if (normalizeAuMobile(current.customerPhone) !== normalized) return;

          onChange({
            ...current,
            customerPhone: formatAuMobileInput(normalized),
            customerFirstName: guest.firstName || current.customerFirstName,
            customerLastName: guest.secondName || current.customerLastName,
            customerPostcode: guest.postcode
              ? formatAuPostcodeInput(guest.postcode)
              : current.customerPostcode,
          });
          setCustomerRating(
            guest.rating === "good" || guest.rating === "bad"
              ? guest.rating
              : null,
          );
          setPhoneHint(
            guest.rating === "good"
              ? guest.name
                ? `Good customer — filled from ${guest.name}`
                : "Good customer — details filled"
              : guest.rating === "bad"
                ? guest.name
                  ? `Bad customer — filled from ${guest.name}`
                  : "Bad customer — details filled"
                : guest.name
                  ? `Saved contact — filled from ${guest.name}`
                  : "Saved contact — details filled",
          );
        } catch {
          if (!cancelled) {
            setPhoneHint(null);
            setCustomerRating(null);
          }
        } finally {
          if (!cancelled) setPhoneLookingUp(false);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lookup only when phone/open changes
  }, [open, values.customerPhone]);

  // Drop a staff selection that is no longer in the options (e.g. shift ended).
  useEffect(() => {
    if (!open || !values.staffId) return;
    if (values.staffId === OTHER_STAFF_SENTINEL) return;
    if (staffOptions.some((member) => member.id === values.staffId)) return;
    onChange({
      ...values,
      staffId: "",
      startsAt: "",
      allowImmediateStart: false,
      otherStaffName: "",
      otherStaffMemberId: "",
    });
    // Only re-run when the selected id or option list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid loop on values object identity
  }, [open, staffOptions, values.staffId]);

  const update = <K extends keyof BookingFormValues>(
    key: K,
    value: BookingFormValues[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  const slotOptions =
    timeSlotOptions ??
    timeOptions.map((time) => ({
      value: time,
      label: formatAmPmTime(buildStartsAtIso(date, time)),
    }));

  const previewTime =
    values.startsAt.length > 0
      ? (slotOptions.find((slot) => slot.value === values.startsAt)?.label ??
        (isIsoDateTime(values.startsAt)
          ? formatAmPmTime(values.startsAt)
          : formatAmPmTime(buildStartsAtIso(date, values.startsAt))))
      : null;

  const selectedOption = serviceOptions.find(
    (option) => String(option.durationMinutes) === values.durationMinutes,
  );

  const startsAtIsoForPrice = values.startsAt
    ? isIsoDateTime(values.startsAt)
      ? values.startsAt
      : buildStartsAtIso(date, values.startsAt)
    : buildStartsAtIso(date, "12:00");

  const priceBreakdown = selectedOption
    ? applyPricingAdjustments({
        baseCents: selectedOption.priceCents,
        startsAtIso: startsAtIsoForPrice,
        timeZone,
        channel: "internal",
        adjustments: pricingAdjustments,
        paymentMethod: paymentMethodForPricing(
          values.paymentMethod || null,
        ),
      })
    : null;

  const displayPriceCents = priceBreakdown?.totalCents ?? null;
  const splitCashCentsPreview = (() => {
    if (values.paymentMethod !== "split" || displayPriceCents == null) {
      return null;
    }
    const cash = Math.round(Number(values.splitCashAmount || 0) * 100);
    if (!Number.isFinite(cash) || cash <= 0 || cash >= displayPriceCents) {
      return null;
    }
    return cash;
  })();
  const splitCardCentsPreview =
    splitCashCentsPreview != null && displayPriceCents != null
      ? displayPriceCents - splitCashCentsPreview
      : null;

  const durationMinutes = Number(values.durationMinutes) || 0;
  const timePickerDisabled = !values.staffId || !values.durationMinutes;
  const timePickerHint = !values.staffId
    ? "Select staff above first"
    : !values.durationMinutes
      ? "Select service above first"
      : timeSlotsHint;

  const today = todayDateInZone(timeZone);
  const isPastDate = date < today;
  const nowDisabled =
    !values.staffId ||
    !values.durationMinutes ||
    isPastDate;

  const chooseNowSlot = () => {
    if (nowDisabled) return;

    const nowLocal = toDatetimeLocalValue(new Date(), timeZone);
    const nowIso = datetimeLocalToIso(nowLocal, timeZone);
    if (date !== today) {
      onDateChange?.(today);
    }
    onChange({
      ...values,
      startsAt: nowIso,
      allowImmediateStart: true,
    });
  };

  const selectedStaffName =
    values.staffId === OTHER_STAFF_SENTINEL
      ? values.otherStaffName.trim() || "Other Staff"
      : (staffOptions.find((member) => member.id === values.staffId)?.name ??
        null);

  const isOtherStaff = values.staffId === OTHER_STAFF_SENTINEL;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      disablePointerDismissal
      closeOnEscape={false}
    >
      <SheetContent
        side="top"
        showCloseButton
        closeLabel="X close"
        className={adminBookingSheetClassName}
      >
        <div className={adminBookingSheetBodyClassName}>
          <div className={adminBookingSheetHandleClassName} />

          <SheetHeader className="shrink-0 border-b border-stone-100 px-4 py-3 pr-20 text-left">
            <p className={theme.eyebrow}>Admin booking</p>
            <SheetTitle className="text-lg font-semibold tracking-tight text-stone-900">
              {title}
            </SheetTitle>
            {previewTime ? (
              <p className="text-sm text-stone-500">{previewTime}</p>
            ) : selectedStaffName ? (
              <p className="text-sm text-stone-500">
                {selectedStaffName} · {date}
              </p>
            ) : (
              <p className="text-sm text-stone-500">{date}</p>
            )}
          </SheetHeader>

          <div ref={scrollRef} className={adminBookingSheetScrollClassName}>
            <div className={cn(theme.panel, "space-y-4")}>
              <FormField label="Staff" required>
                {staffOptions.length === 0 && !isOtherStaff ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    No staff have a shift on this day. Choose Other Staff, or
                    add shifts under Staff.
                  </p>
                ) : null}
                <StaffPicker
                  options={staffOptions}
                  value={values.staffId}
                  nextStaffId={nextRotationStaffId}
                  onSelect={(staffId) => {
                    onChange({
                      ...values,
                      staffId,
                      startsAt: "",
                      allowImmediateStart: false,
                      otherStaffName:
                        staffId === OTHER_STAFF_SENTINEL
                          ? values.otherStaffName
                          : "",
                      otherStaffMemberId:
                        staffId === OTHER_STAFF_SENTINEL
                          ? values.otherStaffMemberId
                          : "",
                    });
                  }}
                />
                {isOtherStaff ? (
                  <div className="mt-3 space-y-3">
                    <div className="space-y-1">
                      <FieldLabel required>Other staff</FieldLabel>
                      <select
                        value={values.otherStaffMemberId}
                        onChange={(event) => {
                          const choice = event.target.value;
                          const picked = otherStaffOptions.find(
                            (member) => member.id === choice,
                          );
                          const isAnyGirl = choice === ANY_GIRL_SENTINEL;
                          onChange({
                            ...values,
                            otherStaffMemberId: choice,
                            otherStaffName: isAnyGirl
                              ? ANY_GIRL_LABEL
                              : (picked?.name ?? values.otherStaffName),
                            paymentMethod: isAnyGirl
                              ? "pre"
                              : values.paymentMethod,
                            walkIn: isAnyGirl ? false : values.walkIn,
                          });
                        }}
                        className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900"
                      >
                        <option value="">Select staff</option>
                        <option value={ANY_GIRL_SENTINEL}>
                          {ANY_GIRL_LABEL}
                        </option>
                        {otherStaffOptions.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-stone-500">
                        Pick from the list. Any time from now is available.{" "}
                        {ANY_GIRL_LABEL} turns on Pre - Book.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-stone-500">
                    Only staff with a shift on this day (and not yet finished)
                    are listed.
                  </p>
                )}
              </FormField>

              <FormField label="Service" required>
                <div className="space-y-2">
                  {serviceOptions.map((option) => {
                    const value = String(option.durationMinutes);
                    const selected = values.durationMinutes === value;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...values,
                            durationMinutes: value,
                            startsAt: "",
                            allowImmediateStart: false,
                          })
                        }
                        className={cn(
                          "flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition",
                          selected
                            ? "border-[#8A6A3A] bg-[#8A6A3A]/10 text-stone-900 ring-2 ring-[#8A6A3A]/25"
                            : "border-stone-200 bg-white text-stone-700 active:bg-stone-50",
                        )}
                      >
                        <span>
                          {formatServiceOptionLabel(
                            option.durationMinutes,
                            option.priceCents,
                            currency,
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FormField>
            </div>

            <BookingCustomerDateTimePicker
              date={date}
              onDateChange={(nextDate) => {
                onDateChange?.(nextDate);
                onChange({ ...values, startsAt: "", allowImmediateStart: false });
              }}
              timeZone={timeZone}
              durationMinutes={durationMinutes || 30}
              slotOptions={slotOptions}
              selectedValue={values.startsAt}
              onSelect={(value) =>
                onChange({
                  ...values,
                  startsAt: value,
                  allowImmediateStart: false,
                })
              }
              loading={timeSlotsLoading}
              hint={timePickerHint}
              roomPreview={values.outCall ? null : suggestedAutoRoomName}
              autoSelectFirst={!timePickerDisabled}
              earliestLeadMinutes={0}
              startTimeRightActions={
                <button
                  type="button"
                  disabled={nowDisabled}
                  onClick={chooseNowSlot}
                  className={cn(
                    "h-[3.25rem] shrink-0 rounded-xl border px-3 text-xs font-semibold transition",
                    nowDisabled
                      ? "border-stone-200 bg-white text-stone-400 opacity-70"
                      : "border-[#8A6A3A] bg-[#8A6A3A]/10 text-stone-900 ring-1 ring-[#8A6A3A]/15 hover:brightness-[0.98]",
                  )}
                >
                  Now
                </button>
              }
            />

            <div className={cn(theme.panel, "space-y-3")}>
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3">
                <input
                  type="checkbox"
                  checked={values.outCall}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      outCall: event.target.checked,
                      roomId: "",
                    })
                  }
                  className="size-5 accent-[#8A6A3A]"
                />
                <span>
                  <span className="block text-sm font-semibold text-stone-900">
                    Out call booking
                  </span>
                  <span className="block text-xs text-stone-500">
                    Off-site service — stays on the staff line, no room
                  </span>
                </span>
              </label>
            </div>

            <div className={cn(theme.panel, "space-y-4")}>
              <BookingCustomerContactFields
                phoneFirst
                phoneLookingUp={phoneLookingUp}
                phoneHint={phoneHint}
                customerRating={customerRating}
                values={{
                  firstName: values.customerFirstName,
                  secondName: values.customerLastName,
                  phone: values.customerPhone,
                  postcode: values.customerPostcode,
                }}
                onChange={(next) => {
                  const phoneChanged =
                    normalizeAuMobile(next.phone) !==
                    normalizeAuMobile(values.customerPhone);
                  if (phoneChanged) {
                    lastLookupPhoneRef.current = "";
                    setPhoneHint(null);
                    setCustomerRating(null);
                  }
                  onChange({
                    ...values,
                    customerFirstName: next.firstName,
                    customerLastName: next.secondName,
                    customerPhone: next.phone,
                    customerPostcode: next.postcode,
                  });
                }}
                fieldClass={theme.field}
                labelClass={theme.label}
                helperTextClass="text-xs text-stone-500"
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-stone-300 bg-stone-200/90 px-4 py-4 shadow-[0_-8px_24px_rgba(28,25,23,0.08)]">
            {displayPriceCents != null ? (
              <div className="mb-3 rounded-xl border border-stone-300/70 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-medium text-stone-500">Total</p>
                  <p className="text-xl font-semibold text-stone-900">
                    {formatPriceFromCents(displayPriceCents, currency)}
                  </p>
                </div>
                {priceBreakdown &&
                (priceBreakdown.nightSurchargeCents > 0 ||
                  priceBreakdown.discountCents > 0) ? (
                  <p className="mt-1 text-right text-xs text-stone-500">
                    {priceBreakdown.nightSurchargeCents > 0
                      ? `+ night ${formatPriceFromCents(priceBreakdown.nightSurchargeCents, currency)}`
                      : ""}
                    {priceBreakdown.nightSurchargeCents > 0 &&
                    priceBreakdown.discountCents > 0
                      ? " · "
                      : ""}
                    {priceBreakdown.discountCents > 0
                      ? `− cash discount ${formatPriceFromCents(priceBreakdown.discountCents, currency)}`
                      : ""}
                  </p>
                ) : !values.startsAt ? (
                  <p className="mt-1 text-right text-xs text-stone-400">
                    Night surcharge updates after time is set
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mb-3">
              <p className="mb-2 text-xs font-medium text-stone-500">
                Booking type
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: true as const, label: "Walk-in" },
                    { value: false as const, label: "Booking" },
                  ] as const
                ).map((option) => {
                  const selected = values.walkIn === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => update("walkIn", option.value)}
                      className={cn(
                        "min-h-11 rounded-xl border text-sm font-semibold transition",
                        selected
                          ? "border-[#8A6A3A] bg-[#8A6A3A]/10 text-stone-900 ring-2 ring-[#8A6A3A]/25"
                          : "border-stone-200 bg-white text-stone-700 active:bg-stone-50",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {values.walkIn === true ? (
                <p className="mt-2 text-xs text-stone-500">
                  Walk-in · counts on rotation and shows as a blue bar
                </p>
              ) : values.walkIn === false ? (
                <p className="mt-2 text-xs text-stone-500">
                  Regular booking · orange bar
                </p>
              ) : (
                <p className="mt-2 text-xs text-stone-500">
                  Select Walk-in or Booking
                </p>
              )}
            </div>

            <div className="mb-3">
              <p className="mb-2 text-xs font-medium text-stone-500">
                Payment method
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "cash" as const, label: "Cash" },
                    { value: "card" as const, label: "Card" },
                    { value: "split" as const, label: "Split" },
                    { value: "pre" as const, label: "Pre - Book" },
                  ] as const
                ).map((option) => {
                  const selected = values.paymentMethod === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...values,
                          paymentMethod: option.value,
                          splitCashAmount:
                            option.value === "split"
                              ? values.splitCashAmount
                              : "",
                        })
                      }
                      className={cn(
                        "min-h-11 rounded-xl border text-sm font-semibold transition",
                        selected
                          ? "border-[#8A6A3A] bg-[#8A6A3A]/10 text-stone-900 ring-2 ring-[#8A6A3A]/25"
                          : "border-stone-200 bg-white text-stone-700 active:bg-stone-50",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {values.paymentMethod === "split" ? (
                <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white px-3 py-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-stone-500">
                      Cash amount ({currency})
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      inputMode="decimal"
                      placeholder="e.g. 20"
                      value={values.splitCashAmount}
                      onChange={(event) =>
                        update("splitCashAmount", event.target.value)
                      }
                      className="h-11 rounded-xl border-stone-200"
                    />
                  </label>
                  <p className="text-xs text-stone-500">
                    {splitCashCentsPreview != null &&
                    splitCardCentsPreview != null
                      ? `Card pays ${formatPriceFromCents(splitCardCentsPreview, currency)} · no cash discount`
                      : displayPriceCents != null
                        ? `Enter cash less than ${formatPriceFromCents(displayPriceCents, currency)} · remainder on card`
                        : "Enter cash amount · remainder on card"}
                  </p>
                </div>
              ) : null}

              {values.paymentMethod === "cash" &&
              pricingAdjustments.discountApplyInternal &&
              pricingAdjustments.discountCents > 0 ? (
                <p className="mt-2 text-xs text-stone-500">
                  Cash discount applied when saving
                </p>
              ) : values.paymentMethod === "card" ? (
                <p className="mt-2 text-xs text-stone-500">
                  Card · recorded for sales, no payment terminal
                </p>
              ) : values.paymentMethod === "pre" ? (
                <p className="mt-2 text-xs text-stone-500">
                  Pre booking · pay later · shows gray until confirmed
                </p>
              ) : values.paymentMethod === "split" ? null : (
                <p className="mt-2 text-xs text-stone-500">
                  Select payment · no payment screen
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={
                submitting ||
                serviceOptions.length === 0 ||
                !values.paymentMethod ||
                values.walkIn == null
              }
              onClick={onSubmit}
              className={theme.goldButton}
            >
              {submitting ? "Saving…" : "Create booking"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
