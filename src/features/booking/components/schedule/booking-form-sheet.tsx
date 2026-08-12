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
import {
  AU_MOBILE_PREFIX,
  AU_POSTCODE_PREFIX,
  formatAuMobileInput,
  formatAuPostcodeInput,
  isValidAuMobile,
  normalizeAuMobile,
} from "@/features/booking/lib/au-contact";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";

import { bookingCustomerTheme as theme } from "../../lib/booking-customer-theme";
import {
  adminBookingSheetBodyClassName,
  adminBookingSheetClassName,
  adminBookingSheetHandleClassName,
  adminBookingSheetScrollClassName,
} from "../../lib/admin-booking-sheet";
import { OTHER_STAFF_SENTINEL } from "../../lib/booking-other-staff";
import type { RoomAvailabilityStatus } from "../../lib/room-availability";
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
const STAFF_CHIP_MAX = 6;

export interface BookingFormValues {
  staffId: string;
  startsAt: string;
  durationMinutes: string;
  roomId: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerPostcode: string;
  customerEmail: string;
  paymentMethod: InternalPaymentMethod | "";
  /** Special admin-only action: allow starting immediately (not 5-min step). */
  allowImmediateStart: boolean;
  /** Off-site service — no treatment room. */
  outCall: boolean;
  /** External staff name when staffId is OTHER_STAFF_SENTINEL. */
  otherStaffName: string;
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
  customerEmail: "",
  paymentMethod: "",
  allowImmediateStart: false,
  outCall: false,
  otherStaffName: "",
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
  roomOptions: { id: string; name: string }[];
  serviceOptions: ServiceOption[];
  pricingAdjustments?: PricingAdjustments;
  currency?: string;
  /** @deprecated Prefer timeSlotOptions (staff availability slots). */
  timeOptions?: string[];
  /** Available start times for the selected staff (and room, if set). */
  timeSlotOptions?: BookingTimeSlotOption[];
  timeSlotsLoading?: boolean;
  timeSlotsHint?: string | null;
  roomStatuses?: RoomAvailabilityStatus[];
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
  onSelect,
}: {
  options: { id: string; name: string }[];
  value: string;
  onSelect: (staffId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const withOther = useMemo(
    () => [...options, { id: OTHER_STAFF_SENTINEL, name: "Other Staff" }],
    [options],
  );
  const useSearch = withOther.length > STAFF_CHIP_MAX;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return withOther;
    return withOther.filter((member) => member.name.toLowerCase().includes(q));
  }, [withOther, query]);

  if (!useSearch) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {withOther.map((member) => {
          const selected = value === member.id;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(member.id)}
              className={cn(
                "min-h-11 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition",
                selected
                  ? "border-[#8A6A3A] bg-[#8A6A3A]/10 text-stone-900 ring-2 ring-[#8A6A3A]/25"
                  : "border-stone-200 bg-white text-stone-700 active:bg-stone-50",
              )}
            >
              {member.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search staff…"
        className="h-11 rounded-xl border-stone-200 bg-white"
        autoComplete="off"
      />
      <div className="max-h-52 overflow-y-auto rounded-xl border border-stone-200 bg-white">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-stone-500">No match.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {filtered.map((member) => {
              const selected = value === member.id;
              return (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(member.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-semibold transition",
                      selected
                        ? "bg-[#8A6A3A]/10 text-stone-900"
                        : "text-stone-700 active:bg-stone-50",
                    )}
                  >
                    <span className="truncate">{member.name}</span>
                    {selected ? (
                      <span className="shrink-0 text-xs font-medium text-[#8A6A3A]">
                        Selected
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="text-xs text-stone-500">
        {options.length} staff · scroll or search
      </p>
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
  roomOptions,
  serviceOptions,
  pricingAdjustments = DEFAULT_PRICING_ADJUSTMENTS,
  currency = "AUD",
  timeOptions = [],
  timeSlotOptions,
  timeSlotsLoading = false,
  timeSlotsHint = null,
  roomStatuses,
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
  valuesRef.current = values;

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
      setPhoneLookingUp(false);
    }
  }, [open]);

  // Any previously saved phone: lookup and autofill name / postcode / email.
  useEffect(() => {
    if (!open) return;
    const phone = values.customerPhone;
    if (!isValidAuMobile(phone)) {
      setPhoneHint(null);
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
            } | null;
          };

          if (cancelled) return;
          lastLookupPhoneRef.current = normalized;

          if (!response.ok || !data.customer) {
            setPhoneHint(null);
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
            customerEmail: guest.email || current.customerEmail,
          });
          setPhoneHint(
            guest.name
              ? `Saved contact — filled from ${guest.name}`
              : "Saved contact — details filled",
          );
        } catch {
          if (!cancelled) setPhoneHint(null);
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
        paymentMethod:
          values.paymentMethod === "cash" || values.paymentMethod === "card"
            ? values.paymentMethod
            : null,
      })
    : null;

  const displayPriceCents = priceBreakdown?.totalCents ?? null;

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

  const selectedRoomName = values.roomId
    ? (roomOptions.find((room) => room.id === values.roomId)?.name ?? null)
    : null;

  const selectedStaffName =
    values.staffId === OTHER_STAFF_SENTINEL
      ? values.otherStaffName.trim() || "Other Staff"
      : (staffOptions.find((member) => member.id === values.staffId)?.name ??
        null);

  const isOtherStaff = values.staffId === OTHER_STAFF_SENTINEL;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className={adminBookingSheetClassName}
      >
        <div className={adminBookingSheetBodyClassName}>
          <div className={adminBookingSheetHandleClassName} />

          <SheetHeader className="shrink-0 border-b border-stone-100 px-4 py-3 pr-12 text-left">
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
                  onSelect={(staffId) =>
                    onChange({
                      ...values,
                      staffId,
                      startsAt: "",
                      allowImmediateStart: false,
                      otherStaffName:
                        staffId === OTHER_STAFF_SENTINEL
                          ? values.otherStaffName
                          : "",
                    })
                  }
                />
                {isOtherStaff ? (
                  <div className="mt-3 space-y-1">
                    <FieldLabel required>Other staff name</FieldLabel>
                    <Input
                      value={values.otherStaffName}
                      onChange={(event) =>
                        onChange({
                          ...values,
                          otherStaffName: event.target.value,
                        })
                      }
                      placeholder="Enter staff name"
                      className="h-11 rounded-xl border-stone-200 bg-white"
                      autoComplete="off"
                    />
                    <p className="text-xs text-stone-500">
                      External staff — any time from now is available.
                    </p>
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
              roomPreview={
                values.outCall
                  ? null
                  : (selectedRoomName ?? suggestedAutoRoomName)
              }
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
              <FormField label="Treatment room">
                <select
                  value={values.roomId}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      roomId: event.target.value,
                      startsAt: "",
                      allowImmediateStart: false,
                    })
                  }
                  disabled={values.outCall}
                  className={cn(theme.field, values.outCall && "opacity-50")}
                >
                  <option value="">
                    {values.outCall
                      ? "Not needed for out call"
                      : suggestedAutoRoomName
                        ? `Auto-assign (${suggestedAutoRoomName})`
                        : "Auto-assign (first free room)"}
                  </option>
                  {(
                    roomStatuses ??
                    roomOptions.map((room) => ({
                      id: room.id,
                      name: room.name,
                      available: true,
                    }))
                  ).map((room) => (
                    <option
                      key={room.id}
                      value={room.id}
                      disabled={room.available === false}
                    >
                      {room.available
                        ? room.name
                        : `${room.name} — booked${room.conflictLabel ? ` ${room.conflictLabel}` : ""}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-stone-500">
                  {values.outCall
                    ? "Out call is off-site — no treatment room is assigned."
                    : values.startsAt
                      ? "Unavailable rooms are disabled for the selected time."
                      : "Pick a time to see which rooms are free."}
                </p>
              </FormField>

              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3">
                <input
                  type="checkbox"
                  checked={values.outCall}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      outCall: event.target.checked,
                      roomId: event.target.checked ? "" : values.roomId,
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

              <label className="block space-y-1">
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={values.customerEmail}
                  onChange={(event) =>
                    update("customerEmail", event.target.value)
                  }
                  className={theme.field}
                  placeholder="optional"
                />
              </label>
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
                Payment method
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "cash" as const, label: "Cash" },
                    { value: "card" as const, label: "Card" },
                  ] as const
                ).map((option) => {
                  const selected = values.paymentMethod === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update("paymentMethod", option.value)}
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
              ) : (
                <p className="mt-2 text-xs text-stone-500">
                  Select cash or card · no payment screen
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={
                submitting ||
                serviceOptions.length === 0 ||
                !values.paymentMethod
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
