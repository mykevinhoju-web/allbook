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
        "relative overflow-hidden rounded-3xl border border-[#E8E6F2] bg-[#F4F6FB] shadow-[0_12px_40px_rgba(27,31,59,0.06)]",
        className,
      )}
    >
      {/* Soft map-like grid / terrain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 20% 30%, rgba(167, 243, 208, 0.35), transparent 55%),
            radial-gradient(ellipse 60% 40% at 75% 65%, rgba(196, 181, 253, 0.4), transparent 50%),
            radial-gradient(ellipse 50% 35% at 55% 20%, rgba(186, 230, 253, 0.35), transparent 45%),
            linear-gradient(135deg, #EEF1F8 0%, #F7F8FC 45%, #EEF0F8 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(107, 92, 246, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(107, 92, 246, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Mock roads */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M0 42 C 25 38, 40 55, 55 48 S 80 30, 100 36"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1.2"
        />
        <path
          d="M18 0 C 22 30, 35 45, 40 100"
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        <path
          d="M70 0 C 65 40, 78 60, 85 100"
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="0.9"
        />
      </svg>

      <div className="absolute left-4 top-4 z-10 rounded-2xl bg-white/90 px-3.5 py-2 shadow-md backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B5CF6]">
          Interactive Map
        </p>
        <p className="text-xs text-[#6B7289]">
          {salons.length} salon{salons.length === 1 ? "" : "s"} nearby
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
                  : "bg-white text-[#1B1F3B] ring-white/80 hover:bg-[#6B5CF6] hover:text-white",
              )}
            >
              <MapPin className="size-3" strokeWidth={2.5} />
              ${salon.startingPrice}
            </span>
            <span
              className={cn(
                "mx-auto mt-0.5 block size-2 rounded-full",
                active ? "bg-[#6B5CF6]" : "bg-[#9AA0B4]",
              )}
            />
          </button>
        );
      })}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/50 to-transparent" />
    </div>
  );
}
