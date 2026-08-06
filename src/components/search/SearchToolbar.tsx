"use client";

/**
 * Search page toolbar — reuses the Landing Hero search UI (`HeroSearch`)
 * so location autocomplete, service select, validation, and routing stay in sync.
 */
import { HeroSearch } from "@/components/HeroSearch";
import { cn } from "@/lib/utils";

type SearchToolbarProps = {
  /** Hydrated from `?location=` */
  location?: string;
  /** Hydrated from `?service=` */
  service?: string;
  className?: string;
};

export function SearchToolbar({
  location = "",
  service = "",
  className,
}: SearchToolbarProps) {
  return (
    <HeroSearch
      key={`${location}|${service}`}
      initialLocation={location}
      initialService={service}
      variant="hero"
      className={cn("w-full", className)}
    />
  );
}
