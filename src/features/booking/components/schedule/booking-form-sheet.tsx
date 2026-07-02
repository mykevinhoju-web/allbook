"use client";

import { AppButton } from "@/components/common";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatPriceFromCents,
  formatServiceOptionLabel,
} from "@/features/services";
import type { ServiceOption } from "@/features/services";

import { formatAmPmTime, buildStartsAtIso } from "../../lib/schedule-utils";

export interface BookingFormValues {
  staffId: string;
  startsAt: string;
  durationMinutes: string;
  customerName: string;
  customerPhone: string;
  customerPostcode: string;
  customerEmail: string;
}

export const defaultBookingFormValues: BookingFormValues = {
  staffId: "",
  startsAt: "",
  durationMinutes: "",
  customerName: "",
  customerPhone: "",
  customerPostcode: "",
  customerEmail: "",
};

interface BookingFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  date: string;
  staffOptions: { id: string; name: string }[];
  serviceOptions: ServiceOption[];
  currency?: string;
  timeOptions: string[];
  values: BookingFormValues;
  onChange: (values: BookingFormValues) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export function BookingFormSheet({
  open,
  onOpenChange,
  title = "New booking",
  date,
  staffOptions,
  serviceOptions,
  currency = "AUD",
  timeOptions,
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

  const previewTime =
    values.startsAt.length > 0
      ? formatAmPmTime(buildStartsAtIso(date, values.startsAt))
      : null;

  const selectedOption = serviceOptions.find(
    (option) => String(option.durationMinutes) === values.durationMinutes,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <label className="block space-y-2 text-sm">
            <span>Staff</span>
            <select
              className="h-10 w-full rounded-xl border border-border/60 bg-background px-3"
              value={values.staffId}
              onChange={(event) => update("staffId", event.target.value)}
            >
              <option value="">Select staff</option>
              {staffOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm">
            <span>Start time (5-minute steps)</span>
            <select
              className="h-10 w-full rounded-xl border border-border/60 bg-background px-3"
              value={values.startsAt}
              onChange={(event) => update("startsAt", event.target.value)}
            >
              <option value="">Select time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {formatAmPmTime(buildStartsAtIso(date, time))} ({time})
                </option>
              ))}
            </select>
            {previewTime ? (
              <p className="text-xs text-muted-foreground">
                Selected: {previewTime}
              </p>
            ) : null}
          </label>

          <label className="block space-y-2 text-sm">
            <span>Service</span>
            <select
              className="h-10 w-full rounded-xl border border-border/60 bg-background px-3"
              value={values.durationMinutes}
              onChange={(event) => update("durationMinutes", event.target.value)}
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
            </select>
            {selectedOption ? (
              <p className="text-xs font-medium text-primary">
                Price: {formatPriceFromCents(selectedOption.priceCents, currency)}
              </p>
            ) : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm">
              <span>
                Customer name <span className="text-destructive">*</span>
              </span>
              <Input
                value={values.customerName}
                onChange={(event) => update("customerName", event.target.value)}
                className="rounded-xl"
                required
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span>
                Phone <span className="text-destructive">*</span>
              </span>
              <Input
                type="tel"
                value={values.customerPhone}
                onChange={(event) => update("customerPhone", event.target.value)}
                className="rounded-xl"
                required
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span>Postcode</span>
              <Input
                value={values.customerPostcode}
                onChange={(event) =>
                  update("customerPostcode", event.target.value)
                }
                className="rounded-xl"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span>Email</span>
              <Input
                type="email"
                value={values.customerEmail}
                onChange={(event) => update("customerEmail", event.target.value)}
                className="rounded-xl"
              />
            </label>
          </div>

          <AppButton
            type="button"
            className="w-full rounded-xl"
            disabled={submitting || serviceOptions.length === 0}
            onClick={onSubmit}
          >
            {submitting ? "Saving..." : "Create booking"}
          </AppButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
