"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  MapPin,
  Share2,
  Star,
} from "lucide-react";

import { formatSalonFullAddress } from "@/features/salon";
import { isSalonOpenNow } from "@/features/search/isSalonOpenNow";
import type { SalonDetail } from "@/types/salon";
import { cn } from "@/lib/utils";

type SalonHeroProps = {
  salon: SalonDetail;
  backHref?: string;
  bookHref?: string;
  onShare?: () => void;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index + 1 <= Math.round(rating);
        return (
          <Star
            key={index}
            className={cn(
              "size-4",
              filled
                ? "fill-amber-400 text-amber-400"
                : "fill-white/20 text-white/35",
            )}
          />
        );
      })}
    </div>
  );
}

/**
 * Full-bleed salon hero — reusable across Hair, Spa, Nails, …
 */
export function SalonHero({
  salon,
  backHref = "/",
  bookHref,
  onShare,
}: SalonHeroProps) {
  const address = formatSalonFullAddress(salon);
  const isOpen = isSalonOpenNow(salon.openingHours);

  return (
    <section className="relative isolate overflow-hidden">
      <div className="relative h-[min(68vh,560px)] w-full sm:h-[520px]">
        <Image
          src={salon.coverImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      <div className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={backHref}
            className="rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-medium text-white backdrop-blur-md transition hover:bg-white/25"
          >
            ← Back
          </Link>
          <button
            type="button"
            aria-label="Share salon"
            onClick={onShare}
            className="inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 sm:px-6 sm:pb-10 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4 sm:gap-5">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-white/25 bg-white/10 shadow-lg backdrop-blur-md sm:size-20">
                {salon.logo ? (
                  <Image
                    src={salon.logo}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg font-semibold text-white">
                    {salon.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {salon.name}
                  </h1>
                  {salon.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-md">
                      <BadgeCheck className="size-3.5 text-sky-300" />
                      Verified
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[12px] font-semibold backdrop-blur-md",
                      isOpen
                        ? "bg-emerald-500/90 text-white"
                        : "bg-neutral-900/70 text-white",
                    )}
                  >
                    {isOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/85">
                  <StarRow rating={salon.rating} />
                  <span className="font-semibold text-white">
                    {salon.rating.toFixed(1)}
                  </span>
                  <span className="text-white/70">
                    {salon.reviewCount.toLocaleString()} reviews
                  </span>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[13px] text-white/75">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span className="line-clamp-2">{address}</span>
                </p>
              </div>
            </div>

            {bookHref ? (
              <Link
                href={bookHref}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100 active:scale-[0.98]"
              >
                Book Now
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
