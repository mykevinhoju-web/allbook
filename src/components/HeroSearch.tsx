"use client";

import { MapPin, Search } from "lucide-react";
import { useRef } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearch } from "@/hooks/useSearch";
import {
  DEFAULT_SEARCH_PLACEHOLDERS,
  SEARCH_SERVICES,
} from "@/lib/search";
import { cn } from "@/lib/utils";

const ACCENT = "#6B5CF6";

type HeroSearchProps = {
  className?: string;
  /** Visual density for marketplace hero vs compact embeds */
  variant?: "hero" | "compact";
  initialLocation?: string;
  initialService?: string;
};

export function HeroSearch({
  className,
  variant = "hero",
  initialLocation = "",
  initialService = "",
}: HeroSearchProps) {
  const {
    location,
    setLocation,
    service,
    setService,
    error,
    suggestions,
    suggestionsOpen,
    setSuggestionsOpen,
    selectSuggestion,
    submit,
  } = useSearch({
    initial: { location: initialLocation, service: initialService },
  });

  const blurTimer = useRef<number | null>(null);
  const isCompact = variant === "compact";

  return (
    <div className={cn("w-full", className)}>
      <form
        className={cn(
          "rounded-2xl border border-neutral-200/80 bg-white shadow-[0_18px_50px_rgba(27,31,59,0.08)]",
          isCompact ? "p-2" : "p-3 sm:p-4",
        )}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border border-neutral-200 bg-[#FAFBFC] p-2 sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5",
            error && "border-rose-200",
          )}
        >
          <div className="relative min-w-0 flex-1">
            <label className="flex items-center gap-2 px-2.5 py-2">
              <MapPin className="size-4 shrink-0 text-[#6B5CF6]" />
              <div className="min-w-0 flex-1">
                {!isCompact ? (
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">
                    Location
                  </span>
                ) : null}
                <input
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => {
                    if (blurTimer.current) window.clearTimeout(blurTimer.current);
                    setSuggestionsOpen(true);
                  }}
                  onBlur={() => {
                    blurTimer.current = window.setTimeout(
                      () => setSuggestionsOpen(false),
                      140,
                    );
                  }}
                  placeholder={DEFAULT_SEARCH_PLACEHOLDERS.location}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={suggestionsOpen}
                  aria-controls="hero-location-suggestions"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "hero-location-error" : undefined}
                  className={cn(
                    "w-full bg-transparent font-medium text-[#1B1F3B] outline-none placeholder:font-normal placeholder:text-[#9AA0B4]",
                    isCompact ? "text-sm" : "text-sm",
                  )}
                  aria-label="Location"
                />
              </div>
            </label>

            {suggestionsOpen && suggestions.length > 0 ? (
              <ul
                id="hero-location-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%-2px)] z-30 overflow-hidden rounded-xl border border-[#E8E6F2] bg-white py-1 shadow-[0_16px_40px_rgba(27,31,59,0.12)]"
              >
                {suggestions.map((suburb) => (
                  <li key={suburb} role="option">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-[#1B1F3B] transition hover:bg-[#F5F3FF]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(suburb)}
                    >
                      <MapPin className="size-3.5 text-[#6B5CF6]" />
                      {suburb}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <span className="hidden w-px self-stretch bg-neutral-200 sm:block" />

          <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 sm:py-2">
            <Search className="size-4 shrink-0 text-[#9AA0B4]" />
            <div className="min-w-0 flex-1">
              {!isCompact ? (
                <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">
                  Service
                </span>
              ) : null}
              <Select
                value={service || undefined}
                onValueChange={(value) => {
                  if (value) setService(value);
                }}
              >
                <SelectTrigger className="h-7 w-full border-0 bg-transparent px-0 text-sm font-medium text-[#1B1F3B] shadow-none focus-visible:ring-0 data-[size=default]:h-7 data-placeholder:text-[#9AA0B4]">
                  <SelectValue placeholder={DEFAULT_SEARCH_PLACEHOLDERS.service} />
                </SelectTrigger>
                <SelectContent align="start" className="rounded-2xl">
                  {SEARCH_SERVICES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            type="submit"
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white transition hover:opacity-90 sm:ml-1",
              isCompact ? "h-10 px-4" : "h-11 px-5",
            )}
            style={{ backgroundColor: ACCENT }}
          >
            Search
          </button>
        </div>
      </form>

      {error ? (
        <p
          id="hero-location-error"
          role="alert"
          className="mt-2 px-1 text-sm font-medium text-rose-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
