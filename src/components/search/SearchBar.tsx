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
import { MARKETPLACE_CATEGORIES } from "@/features/category";
import {
  DEFAULT_SEARCH_PLACEHOLDERS,
  filterLocationSuggestions,
} from "@/lib/search";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  location: string;
  /** Category service label, e.g. "Hair" */
  category: string;
  onLocationChange: (location: string) => void;
  onCategoryChange: (category: string) => void;
  onSearch: () => void;
  /** Lock category when on /hair, /nails, … */
  lockCategory?: boolean;
  className?: string;
};

/**
 * Top search bar: Location · Category · Search
 * Presentation only — parent owns URL state.
 */
export function SearchBar({
  location,
  category,
  onLocationChange,
  onCategoryChange,
  onSearch,
  lockCategory = false,
  className,
}: SearchBarProps) {
  const [draftLocation, setDraftLocation] = useState(location);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);

  useEffect(() => {
    setDraftLocation(location);
  }, [location]);

  const suggestions = filterLocationSuggestions(draftLocation);

  return (
    <form
      className={cn(
        "flex w-full flex-col gap-2 rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-[0_8px_30px_rgba(27,31,59,0.06)] sm:flex-row sm:items-center sm:gap-1.5 sm:p-1.5",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        setSuggestionsOpen(false);
        onLocationChange(draftLocation.trim());
        onSearch();
      }}
    >
      <div className="relative min-w-0 flex-1">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={draftLocation}
          placeholder={DEFAULT_SEARCH_PLACEHOLDERS.location}
          autoComplete="off"
          onChange={(e) => {
            setDraftLocation(e.target.value);
            setSuggestionsOpen(true);
          }}
          onFocus={() => {
            if (blurTimer.current) window.clearTimeout(blurTimer.current);
            setSuggestionsOpen(true);
          }}
          onBlur={() => {
            blurTimer.current = window.setTimeout(
              () => setSuggestionsOpen(false),
              150,
            );
          }}
          className="h-11 w-full rounded-xl border-0 bg-transparent pl-9 pr-3 text-[14px] text-neutral-950 outline-none placeholder:text-neutral-400"
          aria-label="Location"
        />
        {suggestionsOpen && suggestions.length > 0 ? (
          <ul className="absolute left-0 right-0 top-[calc(100%+4px)] z-[60] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
            {suggestions.map((suburb) => (
              <li key={suburb}>
                <button
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-[13px] text-neutral-800 hover:bg-neutral-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setDraftLocation(suburb);
                    setSuggestionsOpen(false);
                    onLocationChange(suburb);
                  }}
                >
                  {suburb}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="hidden h-8 w-px bg-neutral-200 sm:block" />

      <Select
        value={category}
        disabled={lockCategory}
        onValueChange={(value) => {
          if (!value) return;
          onCategoryChange(value);
        }}
      >
        <SelectTrigger className="h-11 w-full min-w-[140px] rounded-xl border-0 bg-neutral-50 px-3 text-[14px] font-medium sm:w-auto">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {MARKETPLACE_CATEGORIES.map((c) => (
            <SelectItem key={c.slug} value={c.service}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-[14px] font-semibold text-white transition hover:bg-neutral-800"
      >
        <Search className="size-4" />
        Search
      </button>
    </form>
  );
}
