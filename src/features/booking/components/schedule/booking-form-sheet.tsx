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

import { bookingCustomerTheme as theme } from "../../lib/booking-customer-theme";
import {
  adminBookingSheetBodyClassName,
  adminBookingSheetClassName,
  adminBookingSheetHandleClassName,
  adminBookingSheetScrollClassName,
} from "../../lib/admin-booking-sheet";
import type { RoomAvailabilityStatus } from "../../lib/room-availability";
import {
  buildStartsAtIso,
  formatAmPmTime,
  isIsoDateTime,
} from "../../lib/schedule-utils";
import { BookingCustomerDateTimePicker } from "../checkout/booking-customer-datetime-picker";

/** Switch to searchable scroll list once the chip grid would get tall. */
const STAFF_CHIP_MAX = 6;

export interface BookingFormValues {
  staffId: string;
  startsAt: string;
  durationMinutes: string;
  roomId: string;
  customerName: string;
  customerPhone: string;
  customerPostcode: string;
  customerEmail: string;
}

export const defaultBookingFormValues: BookingFormValues = {
  staffId: "",
  startsAt: "",
  durationMinutes: "",
  roomId: "",
  customerName: "",
  customerPhone: "",
  customerPostcode: "",
  customerEmail: "",
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
  const useSearch = options.length > STAFF_CHIP_MAX;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((member) => member.name.toLowerCase().includes(q));
  }, [options, query]);

  if (!useSearch) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {options.map((member) => {
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

  useEffect(() => {
    if (!open) return;
    // Always start at the top so Staff / Service are reachable on mobile.
    const id = window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0 });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  // Drop a staff selection that is no longer in the options (e.g. shift ended).
  useEffect(() => {
    if (!open || !values.staffId) return;
    if (staffOptions.some((member) => member.id === values.staffId)) return;
    onChange({ ...values, staffId: "", startsAt: "" });
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

  const durationMinutes = Number(values.durationMinutes) || 0;
  const timePickerDisabled = !values.staffId || !values.durationMinutes;
  const timePickerHint = !values.staffId
    ? "Select staff above first"
    : !values.durationMinutes
      ? "Select service above first"
      : timeSlotsHint;

  const selectedRoomName = values.roomId
    ? (roomOptions.find((room) => room.id === values.roomId)?.name ?? null)
    : null;

  const selectedStaffName =
    staffOptions.find((member) => member.id === values.staffId)?.name ?? null;

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
                {staffOptions.length === 0 ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    No staff have a shift on this day. Add shifts under Staff,
                    then try again.
                  </p>
                ) : (
                  <>
                    <StaffPicker
                      options={staffOptions}
                      value={values.staffId}
                      onSelect={(staffId) =>
                        onChange({
                          ...values,
                          staffId,
                          startsAt: "",
                        })
                      }
                    />
                    <p className="mt-2 text-xs leading-relaxed text-stone-500">
                      Only staff with a shift on this day (and not yet finished)
                      are listed.
                    </p>
                  </>
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
                {selectedOption ? (
                  <div className={theme.priceBox}>
                    <p className={theme.priceLabel}>Amount</p>
                    <p className="mt-1 text-xl font-semibold text-stone-800">
                      {formatPriceFromCents(selectedOption.priceCents, currency)}
                    </p>
                  </div>
                ) : null}
              </FormField>
            </div>

            <BookingCustomerDateTimePicker
              date={date}
              onDateChange={(nextDate) => {
                onDateChange?.(nextDate);
                onChange({ ...values, startsAt: "" });
              }}
              timeZone={timeZone}
              durationMinutes={durationMinutes || 30}
              slotOptions={slotOptions}
              selectedValue={values.startsAt}
              onSelect={(value) => update("startsAt", value)}
              loading={timeSlotsLoading}
              hint={timePickerHint}
              roomPreview={selectedRoomName ?? suggestedAutoRoomName}
              autoSelectFirst={!timePickerDisabled}
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
                    })
                  }
                  className={theme.field}
                >
                  <option value="">
                    {suggestedAutoRoomName
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
                  {values.startsAt
                    ? "Unavailable rooms are disabled for the selected time."
                    : "Pick a time to see which rooms are free."}
                </p>
              </FormField>
            </div>

            <div className={cn(theme.panel, "space-y-4")}>
              <label className="block space-y-1">
                <FieldLabel required>Customer name</FieldLabel>
                <Input
                  value={values.customerName}
                  onChange={(event) =>
                    update("customerName", event.target.value)
                  }
                  className={theme.field}
                  placeholder="Full name"
                  required
                />
              </label>

              <label className="block space-y-1">
                <FieldLabel required>Phone</FieldLabel>
                <Input
                  type="tel"
                  value={values.customerPhone}
                  onChange={(event) =>
                    update("customerPhone", event.target.value)
                  }
                  className={theme.field}
                  placeholder="04xx xxx xxx"
                  required
                />
              </label>

              <label className="block space-y-1">
                <FieldLabel>Postcode</FieldLabel>
                <Input
                  value={values.customerPostcode}
                  onChange={(event) =>
                    update("customerPostcode", event.target.value)
                  }
                  className={theme.field}
                  placeholder="2000"
                />
              </label>

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

          <div className="shrink-0 border-t border-stone-100 bg-white px-4 py-4">
            <button
              type="button"
              disabled={submitting || serviceOptions.length === 0}
              onClick={onSubmit}
              className={theme.goldButton}
            >
              {submitting ? "Saving…" : "Create booking"}
            </button>
            <p className="mt-2 text-center text-xs text-stone-500">
              Walk-in · no card payment on admin create
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
