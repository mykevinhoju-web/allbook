"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  AU_MOBILE_PREFIX,
  AU_POSTCODE_PREFIX,
  formatAuMobileInput,
  formatAuPostcodeInput,
} from "../../lib/au-contact";
import { formatCustomerSecondNameInput } from "../../lib/customer-booking-name";

export type BookingCustomerContactValues = {
  firstName: string;
  secondName: string;
  phone: string;
  postcode: string;
};

export function defaultBookingCustomerContact(): BookingCustomerContactValues {
  return {
    firstName: "",
    secondName: "",
    phone: AU_MOBILE_PREFIX,
    postcode: AU_POSTCODE_PREFIX,
  };
}

type BookingCustomerContactFieldsProps = {
  values: BookingCustomerContactValues;
  onChange: (next: BookingCustomerContactValues) => void;
  fieldClass: string;
  labelClass: string;
  helperTextClass?: string;
  onFieldChange?: () => void;
  /** Internal booking: phone before name for returning-guest lookup. */
  phoneFirst?: boolean;
  phoneHint?: string | null;
  phoneLookingUp?: boolean;
  customerRating?: "good" | "bad" | null;
};

function nameRatingClass(rating: "good" | "bad" | null | undefined) {
  if (rating === "good") return "text-blue-600";
  if (rating === "bad") return "text-red-600";
  return null;
}

export function BookingCustomerContactFields({
  values,
  onChange,
  fieldClass,
  labelClass,
  helperTextClass,
  onFieldChange,
  phoneFirst = false,
  phoneHint = null,
  phoneLookingUp = false,
  customerRating = null,
}: BookingCustomerContactFieldsProps) {
  const patch = (partial: Partial<BookingCustomerContactValues>) => {
    onChange({ ...values, ...partial });
    onFieldChange?.();
  };
  const ratedNameClass = nameRatingClass(customerRating);

  const nameFields = (
    <div className="space-y-1">
      <label className={cn(labelClass, ratedNameClass)}>Name</label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={values.firstName}
          onChange={(event) => patch({ firstName: event.target.value })}
          className={cn(fieldClass, ratedNameClass)}
          placeholder="First name"
          autoCapitalize="words"
          autoComplete="given-name"
          aria-label="First name"
        />
        <Input
          value={values.secondName}
          onChange={(event) =>
            patch({
              secondName: formatCustomerSecondNameInput(event.target.value),
            })
          }
          className={cn(fieldClass, ratedNameClass)}
          placeholder="Lastname"
          autoCapitalize="characters"
          autoComplete="family-name"
          aria-label="Lastname (one letter)"
          maxLength={1}
        />
      </div>
      {helperTextClass ? (
        <p className={cn(helperTextClass, "mt-1 px-0.5")}>
          Lastname initial — one letter only (e.g. Lee → L)
        </p>
      ) : null}
    </div>
  );

  const phoneField = (
    <div>
      <label className={labelClass}>Phone</label>
      <Input
        value={values.phone}
        onChange={(event) =>
          patch({ phone: formatAuMobileInput(event.target.value) })
        }
        onBlur={() => {
          patch({
            phone: formatAuMobileInput(values.phone || AU_MOBILE_PREFIX),
          });
        }}
        className={fieldClass}
        placeholder="04XX XXX XXX"
        inputMode="tel"
        autoComplete="tel-national"
        maxLength={12}
        aria-label="Australian mobile number"
      />
      {phoneLookingUp ? (
        <p className={cn(helperTextClass ?? "text-xs text-stone-500", "mt-1 px-0.5")}>
          Looking up saved contact…
        </p>
      ) : phoneHint ? (
        <p
          className={cn(
            helperTextClass ?? "text-xs text-stone-500",
            "mt-1 px-0.5",
            ratedNameClass,
          )}
        >
          {phoneHint}
        </p>
      ) : helperTextClass ? (
        <p className={cn(helperTextClass, "mt-1 px-0.5")}>
          Australian mobile — starts with 04
          {phoneFirst
            ? ". Any saved phone autofills name & postcode."
            : ""}
        </p>
      ) : null}
    </div>
  );

  const postcodeField = (
    <div>
      <label className={labelClass}>Postcode</label>
      <Input
        value={values.postcode}
        onChange={(event) =>
          patch({ postcode: formatAuPostcodeInput(event.target.value) })
        }
        onBlur={() => {
          patch({
            postcode: formatAuPostcodeInput(
              values.postcode || AU_POSTCODE_PREFIX,
            ),
          });
        }}
        className={fieldClass}
        placeholder="4XXX"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={4}
        aria-label="Queensland postcode"
      />
      {helperTextClass ? (
        <p className={cn(helperTextClass, "mt-1 px-0.5")}>
          Queensland postcode — starts with 4
        </p>
      ) : null}
    </div>
  );

  if (phoneFirst) {
    return (
      <>
        {phoneField}
        {nameFields}
        {postcodeField}
      </>
    );
  }

  return (
    <>
      {nameFields}
      {phoneField}
      {postcodeField}
    </>
  );
}
