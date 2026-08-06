"use client";

import { cn } from "@/lib/utils";

export const SEARCH_FILTER_CHIPS = [
  "Hair",
  "Nails",
  "Spa",
  "Massage",
  "Facial",
  "Waxing",
  "Brows",
  "Open Now",
  "Top Rated",
] as const;

export type SearchFilterChip = (typeof SEARCH_FILTER_CHIPS)[number];

type FilterBarProps = {
  active: SearchFilterChip[];
  onToggle: (chip: SearchFilterChip) => void;
  className?: string;
};

export function FilterBar({ active, onToggle, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role="listbox"
      aria-label="Filters"
      aria-multiselectable
    >
      {SEARCH_FILTER_CHIPS.map((chip) => {
        const isActive = active.includes(chip);
        return (
          <button
            key={chip}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => onToggle(chip)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200",
              isActive
                ? "border-[#6B5CF6] bg-[#6B5CF6] text-white shadow-[0_6px_16px_rgba(107,92,246,0.28)]"
                : "border-[#E8E6F2] bg-white text-[#5B6178] hover:border-[#C9C3F5] hover:bg-[#FAFAFE] hover:text-[#1B1F3B]",
            )}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}
