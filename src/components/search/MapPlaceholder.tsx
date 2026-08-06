"use client";

import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Salon } from "./types";

type MapPlaceholderProps = {
  salons: Salon[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

export function MapPlaceholder({
  salons,
  selectedId,
  onSelect,
  className,
}: MapPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-[#F4F6FB]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 20% 30%, rgba(167, 243, 208, 0.32), transparent 55%),
            radial-gradient(ellipse 60% 40% at 75% 65%, rgba(196, 181, 253, 0.38), transparent 50%),
            radial-gradient(ellipse 50% 35% at 55% 20%, rgba(186, 230, 253, 0.32), transparent 45%),
            linear-gradient(135deg, #EEF1F8 0%, #F7F8FC 45%, #EEF0F8 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(107, 92, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(107, 92, 246, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M0 42 C 25 38, 40 55, 55 48 S 80 30, 100 36"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1.1"
        />
        <path
          d="M18 0 C 22 30, 35 45, 40 100"
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="0.9"
        />
      </svg>

      <div className="absolute left-4 top-4 z-10 rounded-xl bg-white/95 px-3.5 py-2 shadow-md backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B5CF6]">
          Interactive Map
        </p>
        <p className="text-xs text-neutral-500">
          {salons.length} salon{salons.length === 1 ? "" : "s"} · Maps coming soon
        </p>
      </div>

      {salons.map((salon) => {
        const active = selectedId === salon.id;
        return (
          <button
            key={salon.id}
            type="button"
            aria-label={salon.name}
            onClick={() => onSelect?.(salon.id)}
            className={cn(
              "absolute z-[5] -translate-x-1/2 -translate-y-full transition-all duration-300",
              active ? "z-20 scale-110" : "hover:scale-105",
            )}
            style={{ left: `${salon.mapX}%`, top: `${salon.mapY}%` }}
          >
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold shadow-lg ring-2 transition",
                active
                  ? "bg-[#6B5CF6] text-white ring-white"
                  : "bg-white text-neutral-900 ring-white/80 hover:bg-[#6B5CF6] hover:text-white",
              )}
            >
              <MapPin className="size-3" strokeWidth={2.5} />$
              {salon.startingPrice}
            </span>
          </button>
        );
      })}
    </div>
  );
}
