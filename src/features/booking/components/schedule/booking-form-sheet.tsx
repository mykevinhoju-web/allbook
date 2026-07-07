"use client";

import { AppButton } from "@/components/common";
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

import type { RoomAvailabilityStatus } from "../../lib/room-availability";
import {
  buildStartsAtIso,
  formatAmPmTime,
  isIsoDateTime,
} from "../../lib/schedule-utils";
import { BookingTimePicker } from "./booking-time-picker";

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
  values: BookingFormValues;
  onChange: (values: BookingFormValues) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

function IosFieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="text-[13px] text-muted-foreground">
      {children}
      {required ? <span className="text-destructive"> *</span> : null}
    </span>
  );
}

function IosSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-xl border-0 bg-transparent px-0 text-[17px] font-medium text-foreground outline-none",
        className,
      )}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}

function IosGroupedCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-soft">
      {children}
    </div>
  );
}

function IosRow({
  label,
  required,
  children,
  border = true,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1 px-4 py-3",
        border && "border-b border-border/50 last:border-b-0",
      )}
    >
      <IosFieldLabel required={required}>{label}</IosFieldLabel>
      {children}
    </label>
  );
}

export function BookingFormSheet({
  open,
  onOpenChange,
  title = "New booking",
  date,
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
  values,
  onChange,
  onSubmit,
  submitting = false,
}: BookingFormSheetProps) {
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
    ? "Select staff first"
    : !values.durationMinutes
      ? "Select service first"
      : timeSlotsHint;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-[1.25rem] bg-muted/30 px-4 pb-8 pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        <SheetHeader className="px-1 pb-4 text-left">
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {title}
          </SheetTitle>
          {previewTime ? (
            <p className="text-sm text-muted-foreground">{previewTime}</p>
          ) : null}
        </SheetHeader>

        <div className="space-y-5">
          <section>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Appointment
            </p>
            <IosGroupedCard>
              <IosRow label="Staff" required>
                <IosSelect
                  value={values.staffId}
                  onChange={(value) =>
                    onChange({ ...values, staffId: value, startsAt: "" })
                  }
                >
                  <option value="">Select staff</option>
                  {staffOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </IosSelect>
              </IosRow>

              <IosRow label="Service" required>
                <IosSelect
                  value={values.durationMinutes}
                  onChange={(value) =>
                    onChange({
                      ...values,
                      durationMinutes: value,
                      startsAt: "",
                    })
                  }
                >
                  <option value="">Select service</option>
                  {serviceOptions.map((option) => (
                    <option
                      key={option.id}
                      value={String(option.durationMinutes)}
                    >
                      {formatServiceOptionLabel(
                        option.durationMinutes,
                        option.priceCents,
                        currency,
                      )}
                    </option>
                  ))}
                </IosSelect>
                {selectedOption ? (
                  <p className="text-sm font-medium text-primary">
                    {formatPriceFromCents(selectedOption.priceCents, currency)}
                  </p>
                ) : null}
              </IosRow>

            </IosGroupedCard>
          </section>

          <BookingTimePicker
            date={date}
            durationMinutes={durationMinutes || 30}
            slotOptions={slotOptions}
            selectedValue={values.startsAt}
            onSelect={(value) => update("startsAt", value)}
            loading={timeSlotsLoading}
            hint={timePickerHint}
            disabled={timePickerDisabled}
          />

          <section>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Room
            </p>
            <IosGroupedCard>
              <IosRow label="Treatment room" border={false}>
                <IosSelect
                  value={values.roomId}
                  onChange={(value) =>
                    onChange({ ...values, roomId: value, startsAt: "" })
                  }
                >
                  <option value="">
                    {suggestedAutoRoomName
                      ? `Auto-assign (${suggestedAutoRoomName})`
                      : "Auto-assign (first free room)"}
                  </option>
                  {(roomStatuses ?? roomOptions.map((room) => ({
                    id: room.id,
                    name: room.name,
                    available: true,
                  }))).map((room) => (
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
                </IosSelect>
                <p className="text-xs text-muted-foreground">
                  {values.startsAt
                    ? "Unavailable rooms are disabled for the selected time."
                    : "Pick a time to see which rooms are free. Auto-assign uses the first available room."}
                </p>
              </IosRow>
            </IosGroupedCard>
          </section>

          <section>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Customer
            </p>
            <IosGroupedCard>
              <IosRow label="Name" required>
                <Input
                  value={values.customerName}
                  onChange={(event) => update("customerName", event.target.value)}
                  className="h-11 rounded-xl border-0 bg-transparent px-0 text-[17px] shadow-none focus-visible:ring-0"
                  required
                />
              </IosRow>

              <IosRow label="Phone" required>
                <Input
                  type="tel"
                  value={values.customerPhone}
                  onChange={(event) => update("customerPhone", event.target.value)}
                  className="h-11 rounded-xl border-0 bg-transparent px-0 text-[17px] shadow-none focus-visible:ring-0"
                  required
                />
              </IosRow>

              <IosRow label="Postcode">
                <Input
                  value={values.customerPostcode}
                  onChange={(event) =>
                    update("customerPostcode", event.target.value)
                  }
                  className="h-11 rounded-xl border-0 bg-transparent px-0 text-[17px] shadow-none focus-visible:ring-0"
                />
              </IosRow>

              <IosRow label="Email" border={false}>
                <Input
                  type="email"
                  value={values.customerEmail}
                  onChange={(event) => update("customerEmail", event.target.value)}
                  className="h-11 rounded-xl border-0 bg-transparent px-0 text-[17px] shadow-none focus-visible:ring-0"
                />
              </IosRow>
            </IosGroupedCard>
          </section>

          <AppButton
            type="button"
            className="h-12 w-full rounded-2xl text-base font-semibold shadow-sm active:scale-[0.98]"
            disabled={submitting || serviceOptions.length === 0}
            onClick={onSubmit}
          >
            {submitting ? "Saving…" : "Create booking"}
          </AppButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
