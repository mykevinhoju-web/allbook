"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Salon } from "./types";

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
  return (
    <article
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
          ? "border-[#6B5CF6] shadow-[0_12px_32px_rgba(107,92,246,0.14)] ring-2 ring-[#6B5CF6]/20"
          : "border-neutral-200/80 shadow-[0_4px_16px_rgba(27,31,59,0.04)]",
      )}
    >
      {/* Cover image */}
      <div className="relative h-36 sm:h-auto sm:min-h-[148px]">
        <div
          className={cn("absolute inset-0 bg-gradient-to-br", salon.coverGradient)}
        />
        <div
          className="absolute left-3 top-3 flex size-10 items-center justify-center rounded-xl text-xs font-bold text-white shadow-md ring-2 ring-white/90"
          style={{ backgroundColor: salon.logoColor }}
          aria-hidden
        >
          {salon.logoInitials}
        </div>
        <span
          className={cn(
            "absolute bottom-3 left-3 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur",
            salon.isOpen
              ? "bg-emerald-500/95 text-white"
              : "bg-neutral-800/80 text-white",
          )}
        >
          {salon.isOpen ? "Open" : "Closed"}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-neutral-950">
              {salon.name}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-neutral-500">
              <span className="inline-flex items-center gap-1 font-medium text-neutral-900">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {salon.rating.toFixed(1)}
              </span>
              <span className="text-neutral-300">·</span>
              <span>{salon.distanceKm.toFixed(1)} km</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-neutral-400">From</p>
            <p className="text-base font-semibold text-neutral-950">
              ${salon.startingPrice}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {salon.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-50 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600 ring-1 ring-neutral-200/80"
            >
              {tag}
            </span>
          ))}
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
