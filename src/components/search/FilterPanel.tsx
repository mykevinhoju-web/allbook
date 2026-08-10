"use client";

import type { ReactNode } from "react";

import {
  SEARCH_DISTANCE_KM,
  SEARCH_MIN_RATING_OPTIONS,
  SEARCH_SUBURB_OPTIONS,
  type SearchDistanceKm,
} from "@/features/search/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterPanelValues = {
  suburb: string;
  minRating: number | null;
  verifiedOnly: boolean;
  openNow: boolean;
};

type FilterPanelProps = {
  values: FilterPanelValues;
  onChange: (next: Partial<FilterPanelValues>) => void;
  /** Distance filter around the search origin */
  radiusKm?: SearchDistanceKm;
  onRadiusChange?: (radiusKm: SearchDistanceKm) => void;
  className?: string;
};

/**
 * Search filters: Distance · Suburb · Rating · Verified · Open now
 */
export function FilterPanel({
  values,
  onChange,
  radiusKm,
  onRadiusChange,
  className,
}: FilterPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      {onRadiusChange && radiusKm != null ? (
        <Select
          value={String(radiusKm)}
          onValueChange={(value) => {
            if (!value) return;
            onRadiusChange(Number(value) as SearchDistanceKm);
          }}
        >
          <SelectTrigger className="h-9 w-auto min-w-[118px] rounded-full border-neutral-200 bg-neutral-50 px-3 text-[13px] font-medium">
            <SelectValue placeholder="Distance" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {SEARCH_DISTANCE_KM.map((km) => (
              <SelectItem key={km} value={String(km)}>
                Within {km} km
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={values.suburb || "all"}
        onValueChange={(value) => {
          if (!value) return;
          onChange({ suburb: value === "all" ? "" : value });
        }}
      >
        <SelectTrigger className="h-9 w-auto min-w-[132px] rounded-full border-neutral-200 bg-neutral-50 px-3 text-[13px] font-medium">
          <SelectValue placeholder="Suburb" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          <SelectItem value="all">All suburbs</SelectItem>
          {SEARCH_SUBURB_OPTIONS.map((suburb) => (
            <SelectItem key={suburb} value={suburb}>
              {suburb}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(values.minRating ?? 0)}
        onValueChange={(value) => {
          if (value == null) return;
          const n = Number(value);
          onChange({ minRating: n > 0 ? n : null });
        }}
      >
        <SelectTrigger className="h-9 w-auto min-w-[120px] rounded-full border-neutral-200 bg-neutral-50 px-3 text-[13px] font-medium">
          <SelectValue placeholder="Rating" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {SEARCH_MIN_RATING_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ToggleChip
        active={values.verifiedOnly}
        onClick={() => onChange({ verifiedOnly: !values.verifiedOnly })}
      >
        Verified only
      </ToggleChip>

      <ToggleChip
        active={values.openNow}
        onClick={() => onChange({ openNow: !values.openNow })}
      >
        Open now
      </ToggleChip>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3 text-[13px] font-medium transition",
        active
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300",
      )}
    >
      {children}
    </button>
  );
}
