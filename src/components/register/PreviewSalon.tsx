"use client";

import { ImageIcon, Sparkles } from "lucide-react";

import { FALLBACK_COVER_IMAGE } from "@/features/salon-registration/defaults";
import type {
  RegistrationBusinessDetails,
  RegistrationProfile,
} from "@/features/salon-registration";
import { getMarketplaceCategory } from "@/features/category";
import { SALON_AMENITIES } from "@/features/salon/constants";

import {
  registerPrimaryButtonClass,
  registerSecondaryButtonClass,
} from "./register-ui";

type PreviewSalonProps = {
  profile: RegistrationProfile;
  details: RegistrationBusinessDetails;
  submitting?: boolean;
  error?: string | null;
  onBack: () => void;
  onCreate: () => void;
};

export function PreviewSalon({
  profile,
  details,
  submitting = false,
  error,
  onBack,
  onCreate,
}: PreviewSalonProps) {
  const cover = profile.coverImage.trim() || FALLBACK_COVER_IMAGE;
  const category = profile.categorySlug
    ? getMarketplaceCategory(profile.categorySlug)
    : null;
  const amenityLabels = SALON_AMENITIES.filter((a) =>
    details.amenities.includes(a.id),
  ).map((a) => a.label);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Step 5 of 6
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
          Preview your page
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-neutral-600">
          This is how guests will see your salon on AllBook. You can refine
          services and gallery after launch.
        </p>
      </header>

      <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-[#F6F6F7] shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="relative h-56 w-full sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-7">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 sm:size-20">
              {profile.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logo}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Sparkles className="size-7 text-neutral-400" />
              )}
            </div>
            <div className="min-w-0 pb-1 text-white">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
                {category?.label ?? "Salon"}
              </p>
              <h2 className="truncate font-serif text-2xl tracking-tight sm:text-3xl">
                {profile.businessName || "Your salon name"}
              </h2>
              <p className="mt-1 truncate text-[13px] text-white/80">
                {[profile.suburb, profile.state].filter(Boolean).join(", ") ||
                  "Location"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-5 sm:p-7">
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              About
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
              {profile.description.trim() ||
                "Your salon description will appear here. Guests love a short story about your team and specialties."}
            </p>
            {amenityLabels.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {amenityLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-neutral-700 ring-1 ring-neutral-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Services
            </h3>
            <div className="mt-3 rounded-2xl border border-dashed border-neutral-300 bg-white/70 px-4 py-8 text-center">
              <p className="text-[14px] font-medium text-neutral-700">
                Services placeholder
              </p>
              <p className="mt-1 text-[13px] text-neutral-500">
                Add your menu after registration — cuts, colour, treatments, and
                more.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Gallery
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/70 text-neutral-400"
                >
                  <ImageIcon className="size-6" />
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 text-[14px] font-semibold text-white opacity-90"
          >
            Book
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={registerSecondaryButtonClass}
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </button>
        <button
          type="button"
          className={registerPrimaryButtonClass}
          onClick={onCreate}
          disabled={submitting}
        >
          {submitting ? "Creating salon…" : "Create salon"}
        </button>
      </div>
    </div>
  );
}
