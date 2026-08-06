"use client";

import { DAY_OF_WEEK_LABELS, DAY_OF_WEEK_ORDER, SALON_AMENITIES } from "@/features/salon/constants";
import {
  REGISTRATION_LANGUAGE_OPTIONS,
} from "@/features/salon-registration/defaults";
import type { RegistrationBusinessDetails } from "@/features/salon-registration";
import type { AmenityId, DayOfWeek, OpeningHoursDay } from "@/types/salon";
import { cn } from "@/lib/utils";

import {
  RegisterField,
  registerFieldClass,
  registerPrimaryButtonClass,
  registerSecondaryButtonClass,
} from "./register-ui";

type BusinessDetailsProps = {
  value: RegistrationBusinessDetails;
  onChange: (next: RegistrationBusinessDetails) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function BusinessDetails({
  value,
  onChange,
  onBack,
  onContinue,
}: BusinessDetailsProps) {
  function patchDay(day: DayOfWeek, partial: Partial<OpeningHoursDay>) {
    const current = value.openingHours[day] ?? {
      open: "09:00",
      close: "17:00",
      closed: false,
    };
    onChange({
      ...value,
      openingHours: {
        ...value.openingHours,
        [day]: { ...current, ...partial },
      },
    });
  }

  function toggleLanguage(lang: string) {
    const has = value.languages.includes(lang);
    onChange({
      ...value,
      languages: has
        ? value.languages.filter((l) => l !== lang)
        : [...value.languages, lang],
    });
  }

  function toggleAmenity(id: AmenityId) {
    const has = value.amenities.includes(id);
    onChange({
      ...value,
      amenities: has
        ? value.amenities.filter((a) => a !== id)
        : [...value.amenities, id],
    });
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Step 3 of 6
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
          Business details
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-neutral-600">
          Opening hours, socials, languages, and amenities help guests trust
          your page.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-neutral-900">
          Opening hours
        </h2>
        <div className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white">
          {DAY_OF_WEEK_ORDER.map((day) => {
            const hours = value.openingHours[day] ?? {
              open: "09:00",
              close: "17:00",
              closed: false,
            };
            return (
              <div
                key={day}
                className="grid grid-cols-[110px_1fr] items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 sm:grid-cols-[140px_auto_1fr_auto_1fr]"
              >
                <span className="text-[13px] font-medium text-neutral-800">
                  {DAY_OF_WEEK_LABELS[day]}
                </span>
                <label className="flex items-center gap-2 text-[13px] text-neutral-600">
                  <input
                    type="checkbox"
                    checked={hours.closed}
                    onChange={(e) =>
                      patchDay(day, { closed: e.target.checked })
                    }
                  />
                  Closed
                </label>
                <input
                  type="time"
                  disabled={hours.closed}
                  className={cn(registerFieldClass, "disabled:opacity-40")}
                  value={hours.open}
                  onChange={(e) => patchDay(day, { open: e.target.value })}
                />
                <span className="hidden text-neutral-400 sm:inline">–</span>
                <input
                  type="time"
                  disabled={hours.closed}
                  className={cn(registerFieldClass, "disabled:opacity-40")}
                  value={hours.close}
                  onChange={(e) => patchDay(day, { close: e.target.value })}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <RegisterField label="Instagram" htmlFor="bd-ig">
          <input
            id="bd-ig"
            className={registerFieldClass}
            placeholder="@yoursalon"
            value={value.socialInstagram}
            onChange={(e) =>
              onChange({ ...value, socialInstagram: e.target.value })
            }
          />
        </RegisterField>
        <RegisterField label="Facebook" htmlFor="bd-fb">
          <input
            id="bd-fb"
            className={registerFieldClass}
            placeholder="facebook.com/…"
            value={value.socialFacebook}
            onChange={(e) =>
              onChange({ ...value, socialFacebook: e.target.value })
            }
          />
        </RegisterField>
        <RegisterField label="TikTok" htmlFor="bd-tt">
          <input
            id="bd-tt"
            className={registerFieldClass}
            placeholder="@yoursalon"
            value={value.socialTikTok}
            onChange={(e) =>
              onChange({ ...value, socialTikTok: e.target.value })
            }
          />
        </RegisterField>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-neutral-900">Languages</h2>
        <div className="flex flex-wrap gap-2">
          {REGISTRATION_LANGUAGE_OPTIONS.map((lang) => {
            const active = value.languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition",
                  active
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
                )}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-neutral-900">Amenities</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {SALON_AMENITIES.map((item) => {
            const active = value.amenities.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleAmenity(item.id)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-[14px] font-medium transition",
                  active
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300",
                )}
              >
                {item.label}
                <span className="text-[12px] opacity-70">
                  {active ? "On" : "Off"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

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
