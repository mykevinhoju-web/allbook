"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Heart,
  Share2,
  Star,
} from "lucide-react";
import { useState } from "react";

import type { SalonDetail } from "@/types/salon";
import { cn } from "@/lib/utils";

type HeroProps = {
  salon: SalonDetail;
  backHref?: string;
  onFavoriteChange?: (favorited: boolean) => void;
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

export function SalonHero({
  salon,
  backHref = "/search",
  onFavoriteChange,
  onShare,
}: HeroProps) {
  const [favorited, setFavorited] = useState(false);

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
      </div>

      <div className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={backHref}
            className="rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-medium text-white backdrop-blur-md transition hover:bg-white/25"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={favorited ? "Remove favorite" : "Save favorite"}
              onClick={() => {
                const next = !favorited;
                setFavorited(next);
                onFavoriteChange?.(next);
              }}
              className="inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95"
            >
              <Heart
                className={cn(
                  "size-4",
                  favorited && "fill-rose-400 text-rose-400",
                )}
              />
            </button>
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
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 sm:px-6 sm:pb-10 lg:px-8">
          <div className="flex items-end gap-4 sm:gap-5">
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
            <div className="min-w-0 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/85">
                <StarRow rating={salon.rating} />
                <span className="font-semibold text-white">
                  {salon.rating.toFixed(1)}
                </span>
                <span className="text-white/70">
                  {salon.reviewCount.toLocaleString()} reviews
                </span>
                <span className="text-white/40">·</span>
                <span className="text-white/75">
                  {salon.suburb}, {salon.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
