"use client";

import { MARKETPLACE_CATEGORIES } from "@/features/category";
import type { RegistrationProfile } from "@/features/salon-registration";

import {
  RegisterField,
  registerFieldClass,
  registerPrimaryButtonClass,
  registerSecondaryButtonClass,
} from "./register-ui";

type ManualRegistrationProps = {
  value: RegistrationProfile;
  onChange: (next: RegistrationProfile) => void;
  onBack: () => void;
  onContinue: () => void;
  error?: string | null;
};

export function ManualRegistration({
  value,
  onChange,
  onBack,
  onContinue,
  error,
}: ManualRegistrationProps) {
  function patch(partial: Partial<RegistrationProfile>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Step 2 of 6 · Manual
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
          Salon profile
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-neutral-600">
          Tell customers who you are and where to find you. Required fields are
          marked.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <RegisterField label="Business Name" htmlFor="m-name" required className="sm:col-span-2">
          <input
            id="m-name"
            className={registerFieldClass}
            value={value.businessName}
            onChange={(e) => patch({ businessName: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Category" htmlFor="m-category" required className="sm:col-span-2">
          <select
            id="m-category"
            className={registerFieldClass}
            value={value.categorySlug}
            onChange={(e) =>
              patch({
                categorySlug: e.target
                  .value as RegistrationProfile["categorySlug"],
              })
            }
          >
            <option value="">Select category</option>
            {MARKETPLACE_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </RegisterField>
        <RegisterField label="Address" htmlFor="m-address" required className="sm:col-span-2">
          <input
            id="m-address"
            className={registerFieldClass}
            value={value.address}
            onChange={(e) => patch({ address: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Suburb" htmlFor="m-suburb" required>
          <input
            id="m-suburb"
            className={registerFieldClass}
            value={value.suburb}
            onChange={(e) => patch({ suburb: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Postcode" htmlFor="m-postcode" required>
          <input
            id="m-postcode"
            className={registerFieldClass}
            value={value.postcode}
            onChange={(e) => patch({ postcode: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="State" htmlFor="m-state" required>
          <input
            id="m-state"
            className={registerFieldClass}
            value={value.state}
            onChange={(e) => patch({ state: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Country" htmlFor="m-country" required>
          <input
            id="m-country"
            className={registerFieldClass}
            value={value.country}
            onChange={(e) => patch({ country: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Phone" htmlFor="m-phone">
          <input
            id="m-phone"
            className={registerFieldClass}
            value={value.phone}
            onChange={(e) => patch({ phone: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Email" htmlFor="m-email">
          <input
            id="m-email"
            type="email"
            className={registerFieldClass}
            value={value.email}
            onChange={(e) => patch({ email: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Website" htmlFor="m-website" className="sm:col-span-2">
          <input
            id="m-website"
            className={registerFieldClass}
            value={value.website}
            onChange={(e) => patch({ website: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Description" htmlFor="m-description" className="sm:col-span-2">
          <textarea
            id="m-description"
            rows={4}
            className={registerFieldClass}
            value={value.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Share your vibe, specialties, and what guests can expect."
          />
        </RegisterField>
        <RegisterField
          label="Business Logo"
          htmlFor="m-logo"
          hint="Paste an image URL for now. Upload comes later."
        >
          <input
            id="m-logo"
            className={registerFieldClass}
            value={value.logo}
            onChange={(e) => patch({ logo: e.target.value })}
            placeholder="https://"
          />
        </RegisterField>
        <RegisterField
          label="Cover Image"
          htmlFor="m-cover"
          hint="Paste an image URL for now. Upload comes later."
        >
          <input
            id="m-cover"
            className={registerFieldClass}
            value={value.coverImage}
            onChange={(e) => patch({ coverImage: e.target.value })}
            placeholder="https://"
          />
        </RegisterField>
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" className={registerSecondaryButtonClass} onClick={onBack}>
          Back
        </button>
        <button type="button" className={registerPrimaryButtonClass} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
