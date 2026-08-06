"use client";

import { MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SEARCH_DISTANCE_KM,
  SEARCH_SERVICE_FILTERS,
  SEARCH_SORT_OPTIONS,
  type SearchDistanceKm,
  type SearchSort,
} from "@/features/search/constants";
import {
  DEFAULT_SEARCH_PLACEHOLDERS,
  filterLocationSuggestions,
} from "@/lib/search";
import { cn } from "@/lib/utils";

const ACCENT = "#6B5CF6";

export type SearchToolbarValues = {
  location: string;
  service: string;
  radiusKm: SearchDistanceKm;
  sort: SearchSort;
};

type SearchToolbarProps = {
  values: SearchToolbarValues;
  onLocationChange: (location: string) => void;
  onServiceChange: (service: string) => void;
  onRadiusChange: (radiusKm: SearchDistanceKm) => void;
  onSortChange: (sort: SearchSort) => void;
  onSubmit?: () => void;
  /** Hide service select when category route locks the service */
  lockService?: boolean;
  className?: string;
};

/**
 * Presentation-only search toolbar.
 * Parent owns URL/filter state (useSalonSearch).
 */
export function SearchToolbar({
  values,
  onLocationChange,
  onServiceChange,
  onRadiusChange,
  onSortChange,
  onSubmit,
  lockService = false,
  className,
}: SearchToolbarProps) {
  const [draftLocation, setDraftLocation] = useState(values.location);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);

  useEffect(() => {
    setDraftLocation(values.location);
  }, [values.location]);

  const suggestions = filterLocationSuggestions(draftLocation);

  return (
    <div className={cn("w-full space-y-2", className)}>
      <form
        className="rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-[0_8px_30px_rgba(27,31,59,0.06)] sm:p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          setSuggestionsOpen(false);
          onLocationChange(draftLocation.trim());
          onSubmit?.();
        }}
      >
        <div
          className={cn(
            "grid gap-2",
            lockService
              ? "lg:grid-cols-[1.4fr_0.9fr_0.9fr_auto]"
              : "lg:grid-cols-[1.2fr_1fr_0.85fr_0.85fr_auto]",
          )}
        >
          <div className="relative min-w-0">
            <label className="flex min-h-12 items-center gap-2 rounded-xl bg-[#FAFAFE] px-3">
              <MapPin className="size-4 shrink-0 text-[#6B5CF6]" />
              <div className="min-w-0 flex-1 py-1.5">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">
                  Location
                </span>
                <input
                  value={draftLocation}
                  onChange={(e) => {
                    setDraftLocation(e.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  onBlur={() => {
                    blurTimer.current = window.setTimeout(() => {
                      setSuggestionsOpen(false);
                      if (draftLocation.trim() !== values.location) {
                        onLocationChange(draftLocation.trim());
                      }
                    }, 140);
                  }}
                  placeholder={DEFAULT_SEARCH_PLACEHOLDERS.location}
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-medium text-[#1B1F3B] outline-none placeholder:font-normal placeholder:text-[#9AA0B4]"
                  aria-label="Location"
                />
              </div>
            </label>
            {suggestionsOpen && suggestions.length > 0 ? (
              <ul className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-xl border border-[#E8E6F2] bg-white py-1 shadow-lg">
                {suggestions.map((suburb) => (
                  <li key={suburb}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-[#F5F3FF]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (blurTimer.current) window.clearTimeout(blurTimer.current);
                        setDraftLocation(suburb);
                        setSuggestionsOpen(false);
                        onLocationChange(suburb);
                      }}
                    >
                      <MapPin className="size-3.5 text-[#6B5CF6]" />
                      {suburb}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {!lockService ? (
            <div className="flex min-h-12 items-center gap-2 rounded-xl bg-[#FAFAFE] px-3">
              <Search className="size-4 shrink-0 text-[#9AA0B4]" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">
                  Service
                </span>
                <Select
                  value={values.service || undefined}
                  onValueChange={(value) => {
                    if (value) onServiceChange(value);
                  }}
                >
                  <SelectTrigger className="h-7 w-full border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0 data-[size=default]:h-7 data-placeholder:text-[#9AA0B4]">
                    <SelectValue
                      placeholder={DEFAULT_SEARCH_PLACEHOLDERS.service}
                    />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-2xl">
                    {SEARCH_SERVICE_FILTERS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="flex min-h-12 items-center rounded-xl bg-[#FAFAFE] px-3">
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">
                Distance
              </span>
              <Select
                value={String(values.radiusKm)}
                onValueChange={(value) => {
                  if (!value) return;
                  onRadiusChange(Number(value) as SearchDistanceKm);
                }}
              >
                <SelectTrigger className="h-7 w-full border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0 data-[size=default]:h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className="rounded-2xl">
                  {SEARCH_DISTANCE_KM.map((km) => (
                    <SelectItem key={km} value={String(km)}>
                      Within {km} km
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex min-h-12 items-center rounded-xl bg-[#FAFAFE] px-3">
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">
                Sort
              </span>
              <Select
                value={values.sort}
                onValueChange={(value) => {
                  if (value) onSortChange(value as SearchSort);
                }}
              >
                <SelectTrigger className="h-7 w-full border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0 data-[size=default]:h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className="rounded-2xl">
                  {SEARCH_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
