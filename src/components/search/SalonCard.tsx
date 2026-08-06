"use client";

import { Heart, MapPin, Star } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Salon } from "./types";

const ACCENT = "#6B5CF6";

type SalonCardProps = {
  salon: Salon;
  favorited?: boolean;
  selected?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onSelect?: (id: string) => void;
  onBook?: (id: string) => void;
};

export function SalonCard({
  salon,
  favorited = false,
  selected = false,
  onFavoriteToggle,
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
        "group overflow-hidden rounded-3xl border bg-white shadow-[0_8px_28px_rgba(27,31,59,0.05)] transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(27,31,59,0.1)]",
        selected
          ? "border-[#6B5CF6] ring-2 ring-[#6B5CF6]/20"
          : "border-[#EEEAF8]",
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "h-40 bg-gradient-to-br sm:h-44",
            salon.coverGradient,
          )}
        >
          <div className="absolute inset-0 flex items-end justify-between p-4">
            <div
              className="flex size-12 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-lg ring-2 ring-white/80 transition duration-300 group-hover:scale-105"
              style={{ backgroundColor: salon.logoColor }}
              aria-hidden
            >
              {salon.logoInitials}
            </div>
            <button
              type="button"
              aria-label={favorited ? "Remove from favourites" : "Save favourite"}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle?.(salon.id);
              }}
              className={cn(
                "flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-110",
                favorited ? "text-[#EC4899]" : "text-[#9AA0B4] hover:text-[#EC4899]",
              )}
            >
              <Heart
                className="size-4"
                fill={favorited ? "currentColor" : "none"}
                strokeWidth={2.2}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-semibold tracking-tight text-[#1B1F3B]">
              {salon.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#6B7289]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#1B1F3B]">
                <Star className="size-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                {salon.rating.toFixed(1)}
              </span>
              <span>({salon.reviewCount} reviews)</span>
              <span className="text-[#D1D5E0]">·</span>
              <span>{salon.distanceKm.toFixed(1)} km</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9AA0B4]">
              From
            </p>
            <p className="text-lg font-semibold text-[#1B1F3B]">
              ${salon.startingPrice}
            </p>
          </div>
        </div>

        <p className="flex items-start gap-1.5 text-[13px] leading-snug text-[#6B7289]">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#9AA0B4]" />
          <span>
            {salon.address}
            <span className="text-[#9AA0B4]"> · {salon.suburb}</span>
          </span>
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              salon.isOpen
                ? "bg-emerald-50 text-emerald-700"
                : "bg-neutral-100 text-neutral-500",
            )}
          >
            {salon.isOpen ? "Open" : "Closed"}
          </span>
          {salon.availableToday ? (
            <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#4F46E5]">
              Available Today
            </span>
          ) : null}
          {salon.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#FAFAFE] px-2.5 py-0.5 text-[11px] font-medium text-[#5B6178] ring-1 ring-[#E8E6F2]"
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBook?.(salon.id);
          }}
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white transition duration-200 hover:opacity-95 hover:shadow-[0_10px_24px_rgba(107,92,246,0.3)] active:scale-[0.99]"
          style={{ backgroundColor: ACCENT }}
        >
          Book Now
        </button>
      </div>
    </article>
  );
}
