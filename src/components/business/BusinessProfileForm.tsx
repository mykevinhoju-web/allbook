"use client";

import { BadgeCheck } from "lucide-react";

import type { ReactNode } from "react";

import type {
  BusinessProfile,
  BusinessProfileInput,
  BusinessSettings,
} from "@/features/business";
import { cn } from "@/lib/utils";

import { BusinessHoursEditor } from "./BusinessHoursEditor";
import { BusinessLocation } from "./BusinessLocation";
import { CoverUploader } from "./CoverUploader";
import { LogoUploader } from "./LogoUploader";
import { OwnerKeywordsEditor } from "./OwnerKeywordsEditor";
import { SocialLinks } from "./SocialLinks";

type BusinessProfileFormProps = {
  value: BusinessProfileInput & {
    settings: BusinessSettings;
  };
  onChange: (next: BusinessProfileFormProps["value"]) => void;
  onUploadFile: (file: File, kind: "logo" | "cover") => Promise<string>;
  /** Platform-wide max owner keywords (super-admin setting). */
  ownerKeywordLimit?: number;
  /** When false, Featured toggle is read-only */
  allowFeaturedEdit?: boolean;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400";

export function BusinessProfileForm({
  value,
  onChange,
  onUploadFile,
  ownerKeywordLimit = 5,
  allowFeaturedEdit = false,
}: BusinessProfileFormProps) {
  function patch(partial: Partial<BusinessProfileFormProps["value"]>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-6">
      <Section title="Basic information">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Business name">
            <input
              value={value.name}
              onChange={(e) => patch({ name: e.target.value })}
              className={cn(inputClass, "sm:col-span-2")}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                rows={4}
                value={value.description}
                onChange={(e) => patch({ description: e.target.value })}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </Field>
          </div>
          <Field label="Phone">
            <input
              value={value.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={value.email}
              onChange={(e) => patch({ email: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Website">
              <input
                type="url"
                value={value.website}
                onChange={(e) => patch({ website: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        title="Search keywords"
        description="Help customers find you on AllBook. These appear in marketplace search filters."
      >
        <OwnerKeywordsEditor
          value={value.ownerKeywords}
          limit={ownerKeywordLimit}
          onChange={(ownerKeywords) => patch({ ownerKeywords })}
        />
      </Section>

      <Section
        title="Branding"
        description="Logo and cover image shown on your public page."
      >
        <div className="space-y-6">
          <LogoUploader
            value={value.logo}
            onChange={(logo) => patch({ logo })}
            onUploadFile={(file) => onUploadFile(file, "logo")}
          />
          <CoverUploader
            value={value.coverImage}
            onChange={(coverImage) => patch({ coverImage })}
            onUploadFile={(file) => onUploadFile(file, "cover")}
          />
        </div>
      </Section>

      <Section title="Location">
        <BusinessLocation
          address={value.address}
          suburb={value.suburb}
          latitude={value.latitude}
          longitude={value.longitude}
          onChange={(next) => patch(next)}
        />
      </Section>

      <Section
        title="Business hours"
        description="Displayed on your public salon page."
      >
        <BusinessHoursEditor
          value={value.openingHours}
          onChange={(openingHours) => patch({ openingHours })}
        />
      </Section>

      <Section title="Social media">
        <SocialLinks
          value={value.social}
          onChange={(social) => patch({ social })}
        />
      </Section>

      <Section title="Business settings">
        <div className="space-y-3">
          <ToggleRow
            label="Booking enabled"
            description="Allow customers to book online."
            checked={value.settings.bookingEnabled}
            onChange={(bookingEnabled) =>
              patch({
                settings: { ...value.settings, bookingEnabled },
              })
            }
          />
          <ToggleRow
            label="Accept new customers"
            description="Show as open for first-time bookings."
            checked={value.settings.acceptNewCustomers}
            onChange={(acceptNewCustomers) =>
              patch({
                settings: { ...value.settings, acceptNewCustomers },
              })
            }
          />
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                Verified badge
              </p>
              <p className="text-[13px] text-neutral-500">
                Managed by AllBook · read only
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                value.settings.verified
                  ? "bg-sky-50 text-sky-700"
                  : "bg-neutral-200 text-neutral-600",
              )}
            >
              {value.settings.verified ? (
                <>
                  <BadgeCheck className="size-3.5" />
                  Verified
                </>
              ) : (
                "Not verified"
              )}
            </span>
          </div>
          <ToggleRow
            label="Featured"
            description="Admin only — featured is not stored on salons yet."
            checked={false}
            disabled
            onChange={() => undefined}
          />
        </div>
      </Section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3",
        disabled ? "bg-neutral-50 opacity-80" : "bg-white",
      )}
    >
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <p className="text-[13px] text-neutral-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 rounded border-neutral-300"
      />
    </label>
  );
}

export function toBusinessFormValue(
  business: BusinessProfile,
): BusinessProfileFormProps["value"] {
  return {
    name: business.name,
    description: business.description,
    phone: business.phone,
    email: business.email,
    website: business.website,
    logo: business.logo,
    coverImage: business.coverImage,
    address: business.address,
    suburb: business.suburb,
    latitude: business.latitude,
    longitude: business.longitude,
    openingHours: business.openingHours,
    social: business.social,
    ownerKeywords: business.ownerKeywords ?? [],
    settings: business.settings,
  };
}
