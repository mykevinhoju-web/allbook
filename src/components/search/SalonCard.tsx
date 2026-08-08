"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { MapPin, Star } from "lucide-react";

import type { Salon } from "@/types/salon";
import { cn } from "@/lib/utils";

type SalonCardProps = {
  salon: Salon;
  categorySlug?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onBook?: (id: string) => void;
};

export function SalonCard({
  salon,
  categorySlug = "hair",
  selected = false,
  onSelect,
  onBook,
}: SalonCardProps) {
  const ref = useRef<HTMLElement>(null);
  const href = salon.slug
    ? `/${categorySlug}/${encodeURIComponent(salon.slug)}`
    : `/salon/${salon.id}`;

  useEffect(() => {
    if (!selected || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected]);

  return (
    <article
      ref={ref}
      id={`salon-card-${salon.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(salon.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(salon.id);
        }
      }}
      className={cn(
        "group grid overflow-hidden rounded-2xl border bg-white transition-all duration-300 sm:grid-cols-[148px_minmax(0,1fr)]",
        "hover:shadow-[0_12px_32px_rgba(27,31,59,0.1)]",
        selected
          ? "border-neutral-950 shadow-[0_12px_32px_rgba(15,23,42,0.14)] ring-1 ring-neutral-950/10"
          : "border-neutral-200/80 shadow-[0_4px_16px_rgba(27,31,59,0.04)]",
      )}
    >
      <div className="relative h-36 sm:h-auto sm:min-h-[148px]">
        <Image
          src={salon.coverImage}
          alt=""
          fill
          loading="lazy"
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 148px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {salon.logo ? (
          <div className="absolute left-3 top-3 size-10 overflow-hidden rounded-xl border border-white/70 bg-white shadow">
            <Image
              src={salon.logo}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              className="size-full object-cover"
            />
          </div>
        ) : null}
        {typeof salon.isOpen === "boolean" ? (
          <span
            className={cn(
              "absolute bottom-3 left-3 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur",
              salon.isOpen
                ? "bg-emerald-500/95 text-white"
                : "bg-neutral-900/80 text-white",
            )}
          >
            {salon.isOpen ? "Open" : "Closed"}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-neutral-950">
              <Link
                href={href}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline"
              >
                {salon.name}
              </Link>
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-500">
              <span className="inline-flex items-center gap-1 font-medium text-neutral-900">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {salon.rating.toFixed(1)}
                <span className="font-normal text-neutral-400">
                  ({salon.reviewCount})
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {salon.suburb}
                {typeof salon.distanceKm === "number" ? (
                  <span className="text-neutral-400">
                    · {salon.distanceKm < 10
                      ? `${salon.distanceKm.toFixed(1)} km`
                      : `${Math.round(salon.distanceKm)} km`}
                  </span>
                ) : null}
              </span>
              {salon.verified ? (
                <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700">
                  Verified
                </span>
              ) : null}
            </div>
            {salon.address ? (
              <p className="mt-1 truncate text-[12px] text-neutral-400">
                {salon.address}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:flex-none sm:px-5"
          >
            Book Now
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBook?.(salon.id);
            }}
            className="hidden"
            aria-hidden
          />
        </div>
      </div>
    </article>
  );
}
