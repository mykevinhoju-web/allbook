"use client";

import type { RegistrationOwnerAccount } from "@/features/salon-registration";

import {
  RegisterField,
  registerFieldClass,
  registerPrimaryButtonClass,
  registerSecondaryButtonClass,
} from "./register-ui";

type OwnerAccountProps = {
  value: RegistrationOwnerAccount;
  onChange: (next: RegistrationOwnerAccount) => void;
  onBack: () => void;
  onContinue: () => void;
  error?: string | null;
};

export function OwnerAccount({
  value,
  onChange,
  onBack,
  onContinue,
  error,
}: OwnerAccountProps) {
  function patch(partial: Partial<RegistrationOwnerAccount>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Step 4 of 6
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
          Owner account
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-neutral-600">
          This login will manage your salon page. Payment setup comes later —
          just create your account for now.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <RegisterField label="Owner Name" htmlFor="o-name" required className="sm:col-span-2">
          <input
            id="o-name"
            className={registerFieldClass}
            value={value.ownerName}
            onChange={(e) => patch({ ownerName: e.target.value })}
            autoComplete="name"
          />
        </RegisterField>
        <RegisterField label="Email" htmlFor="o-email" required className="sm:col-span-2">
          <input
            id="o-email"
            type="email"
            className={registerFieldClass}
            value={value.ownerEmail}
            onChange={(e) => patch({ ownerEmail: e.target.value })}
            autoComplete="email"
          />
        </RegisterField>
        <RegisterField label="Password" htmlFor="o-password" required>
          <input
            id="o-password"
            type="password"
            className={registerFieldClass}
            value={value.password}
            onChange={(e) => patch({ password: e.target.value })}
            autoComplete="new-password"
          />
        </RegisterField>
        <RegisterField label="Confirm Password" htmlFor="o-confirm" required>
          <input
            id="o-confirm"
            type="password"
            className={registerFieldClass}
            value={value.confirmPassword}
            onChange={(e) => patch({ confirmPassword: e.target.value })}
            autoComplete="new-password"
          />
        </RegisterField>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={value.acceptedTerms}
          onChange={(e) => patch({ acceptedTerms: e.target.checked })}
        />
        <span>
          I accept the AllBook Terms of Service and Privacy Policy, and confirm
          I am authorised to register this business.
        </span>
      </label>

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
          Continue to preview
        </button>
      </div>
    </div>
  );
}
