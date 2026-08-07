"use client";

import { MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MARKETPLACE_CATEGORIES } from "@/features/category";
import { useSearch } from "@/hooks/useSearch";
import { DEFAULT_SEARCH_PLACEHOLDERS } from "@/lib/search";
import { cn } from "@/lib/utils";

type HeroSearchProps = {
  className?: string;
  /** Visual density for marketplace hero vs category toolbar */
  variant?: "hero" | "compact";
  initialLocation?: string;
  initialCategory?: string;
};

/**
 * Reusable location + category search.
 * Landing and category result pages share this component.
 */
export function HeroSearch({
  className,
  variant = "hero",
  initialLocation = "",
  initialCategory = "",
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
    initial: { location: initialLocation, service: initialCategory },
  });

  const blurTimer = useRef<number | null>(null);
  const isCompact = variant === "compact";

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation, setLocation]);

  useEffect(() => {
    setService(initialCategory);
  }, [initialCategory, setService]);

  return (
    <div className={cn("w-full", className)}>
      <form
        className={cn(
          "group/search relative transition duration-500",
            isCompact
              ? "rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-[0_12px_32px_rgba(17,17,17,0.06)]"
              : cn(
                  "relative z-20 rounded-[2rem] p-[1px]",
                  "bg-gradient-to-b from-white via-white to-neutral-100",
                  "shadow-[0_24px_80px_rgba(0,0,0,0.35)]",
                  "hover:shadow-[0_28px_90px_rgba(0,0,0,0.4)]",
                  "focus-within:shadow-[0_28px_90px_rgba(0,0,0,0.42)]",
                ),
        )}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-stretch",
            isCompact
              ? cn(
                  "gap-2 rounded-xl border border-neutral-200 bg-[#FAFBFC] p-1.5",
                  error && "border-rose-200",
                )
              : cn(
                  "overflow-visible rounded-[1.9rem] bg-white",
                  "ring-1 ring-inset ring-neutral-200/80",
                  error && "ring-rose-300/80",
                ),
          )}
        >
          <div
            className={cn(
              "relative min-w-0 flex-1",
              !isCompact &&
                "transition-colors duration-300 hover:bg-black/[0.03] sm:rounded-l-[1.9rem]",
            )}
          >
            <label
              className={cn(
                "flex h-full items-center gap-3",
                isCompact ? "px-2.5 py-2" : "px-5 py-4 sm:px-6 sm:py-5",
              )}
            >
              <MapPin
                className={cn(
                  "shrink-0",
                  isCompact ? "size-4 text-neutral-500" : "size-5 text-neutral-800",
                )}
              />
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block font-semibold uppercase tracking-[0.14em] text-neutral-400",
                    isCompact ? "text-[10px]" : "text-[11px]",
                  )}
                >
                  Location
                </span>
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
                    "w-full bg-transparent font-medium text-neutral-950 outline-none placeholder:font-normal placeholder:text-neutral-400",
                    isCompact ? "text-sm" : "mt-0.5 text-base sm:text-[17px]",
                  )}
                  aria-label="Location"
                />
              </div>
            </label>

            {suggestionsOpen && suggestions.length > 0 ? (
              <ul
                id="hero-location-suggestions"
                role="listbox"
                className={cn(
                  "absolute left-3 right-3 z-50 overflow-hidden py-1.5",
                  "rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.22)]",
                  isCompact ? "top-[calc(100%+4px)]" : "top-[calc(100%+6px)]",
                )}
              >
                {suggestions.map((suburb) => (
                  <li key={suburb} role="option">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-neutral-800 transition hover:bg-neutral-100/90"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(suburb)}
                    >
                      <MapPin className="size-3.5 text-neutral-400" />
                      {suburb}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <span
            className={cn(
              "hidden self-stretch sm:block",
              isCompact ? "w-px bg-neutral-200" : "w-px bg-neutral-200/80",
            )}
          />

          <div
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3",
              isCompact ? "px-2.5 py-1.5" : "px-5 py-4 transition-colors duration-300 hover:bg-black/[0.03] sm:px-6 sm:py-5",
            )}
          >
            <Sparkles
              className={cn(
                "shrink-0",
                isCompact ? "size-4 text-neutral-400" : "size-5 text-neutral-800",
              )}
            />
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "block font-semibold uppercase tracking-[0.14em] text-neutral-400",
                  isCompact ? "text-[10px]" : "text-[11px]",
                )}
              >
                Category
              </span>
              <Select
                value={service || undefined}
                onValueChange={(value) => {
                  if (value) setService(value);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "w-full border-0 bg-transparent px-0 font-medium text-neutral-950 shadow-none focus-visible:ring-0 data-placeholder:text-neutral-400",
                    isCompact
                      ? "h-7 text-sm data-[size=default]:h-7"
                      : "mt-0.5 h-8 text-base sm:text-[17px] data-[size=default]:h-8",
                  )}
                >
                  <SelectValue
                    placeholder={DEFAULT_SEARCH_PLACEHOLDERS.category}
                  />
                </SelectTrigger>
                <SelectContent align="start" className="rounded-2xl">
                  {MARKETPLACE_CATEGORIES.map((item) => (
                    <SelectItem key={item.slug} value={item.service}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={cn(
              "flex items-center",
              isCompact ? "sm:pl-1" : "p-2 sm:p-2.5",
            )}
          >
            <button
              type="submit"
              className={cn(
                "inline-flex w-full shrink-0 items-center justify-center gap-2 font-semibold text-white transition duration-300",
                "bg-neutral-950 hover:bg-neutral-800 active:scale-[0.98]",
                isCompact
                  ? "h-10 rounded-xl px-4 text-sm"
                  : "h-14 rounded-[1.35rem] px-7 text-[15px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.3)] sm:min-w-[148px]",
              )}
            >
              <Search className={isCompact ? "size-4" : "size-[18px]"} />
              Search
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <p
          id="hero-location-error"
          role="alert"
          className={cn(
            "mt-3 px-1 text-sm font-medium",
            isCompact ? "text-rose-600" : "text-rose-100",
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
