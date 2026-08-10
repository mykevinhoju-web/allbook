"use client";

import { useState } from "react";

import { MARKETPLACE_CATEGORIES } from "@/features/category";
import type { CatalogueMatch } from "@/features/salon-registration";
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
  /** Switch wizard to Google claim using a catalogue match */
  onClaimMatch?: (match: CatalogueMatch) => void;
  error?: string | null;
};

export function ManualRegistration({
  value,
  onChange,
  onBack,
  onContinue,
  onClaimMatch,
  error,
}: ManualRegistrationProps) {
  const [checking, setChecking] = useState(false);
  const [matches, setMatches] = useState<CatalogueMatch[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  function patch(partial: Partial<RegistrationProfile>) {
    onChange({ ...value, ...partial });
  }

  async function handleContinue() {
    setLocalError(null);
    setChecking(true);
    try {
      const res = await fetch("/api/register/catalogue-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: value.businessName,
          phone: value.phone,
          address: value.address,
          suburb: value.suburb,
          postcode: value.postcode,
          website: value.website,
        }),
      });
      const data = (await res.json()) as {
        blocked?: boolean;
        hardMatches?: CatalogueMatch[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Could not check existing listings.");
      }
      if (data.blocked && data.hardMatches && data.hardMatches.length > 0) {
        setMatches(data.hardMatches);
        setLocalError(
          "This looks like a business already on AllBook. Claim that listing instead of creating a duplicate.",
        );
        return;
      }
      setMatches([]);
      onContinue();
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not check existing listings.",
      );
    } finally {
      setChecking(false);
    }
  }

  const showError = localError || error;

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
          Use this only if your salon is not already listed. If name, phone, or
          address matches an existing AllBook business, registration will be
          blocked and you will be asked to claim it instead.
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
      </div>

      {matches.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-900">
            Existing listings found
          </p>
          {matches.slice(0, 3).map((match) => (
            <div
              key={match.id}
              className="flex flex-col gap-2 rounded-xl border border-rose-100 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {match.name}
                </p>
                <p className="text-[12px] text-neutral-500">
                  {[match.suburb, match.city].filter(Boolean).join(", ")}
                  {match.phone ? ` · ${match.phone}` : ""}
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  Matched on {match.reasons.join(", ").replaceAll("_", " ")}
                </p>
              </div>
              {onClaimMatch ? (
                <button
                  type="button"
                  className={registerPrimaryButtonClass}
                  onClick={() => onClaimMatch(match)}
                >
                  Claim this business
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {showError ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {showError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" className={registerSecondaryButtonClass} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={registerPrimaryButtonClass}
          disabled={checking}
          onClick={() => void handleContinue()}
        >
          {checking ? "Checking…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
