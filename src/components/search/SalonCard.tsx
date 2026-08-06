"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { MapPin, Star } from "lucide-react";

import type { Salon } from "@/types/salon";
import { cn } from "@/lib/utils";

const ACCENT = "#6B5CF6";

type SalonCardProps = {
  salon: Salon;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onBook?: (id: string) => void;
};

export function SalonCard({
  salon,
  selected = false,
  onSelect,
  onBook,
}: SalonCardProps) {
  const ref = useRef<HTMLElement>(null);

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
        "hover:shadow-[0_12px_32px_rgba(27,31,59,0.1)] hover:scale-[1.01]",
        selected
          ? "border-[#6B5CF6] shadow-[0_12px_32px_rgba(107,92,246,0.18)] ring-2 ring-[#6B5CF6]/25 scale-[1.01]"
          : "border-neutral-200/80 shadow-[0_4px_16px_rgba(27,31,59,0.04)]",
      )}
    >
      <div className="relative h-36 sm:h-auto sm:min-h-[148px]">
        <Image
          src={salon.coverImage}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 148px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-neutral-800 backdrop-blur">
          {salon.service}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-neutral-950">
              {salon.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-500">
              <span className="inline-flex items-center gap-1 font-medium text-neutral-900">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {salon.rating.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {salon.suburb}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-neutral-400">From</p>
            <p className="text-base font-semibold text-neutral-950">
              ${salon.price}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBook?.(salon.id);
            }}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] sm:w-auto sm:px-5"
            style={{ backgroundColor: ACCENT }}
          >
            Book
          </button>
        </div>
      </div>
    </article>
  );
}
