"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { List, Map as MapIcon } from "lucide-react";

import {
  buildCategoryResultsTitle,
  formatLocationDisplay,
  resolveCategoryFromService,
  type MarketplaceCategory,
} from "@/features/category";
import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";
import { useMap } from "@/hooks/useMap";
import { useSalonSearch } from "@/hooks/useSalonSearch";
import type { SearchSalonsResult } from "@/features/search";
import { cn } from "@/lib/utils";

import { EmptyState } from "./EmptyState";
import { FilterPanel } from "./FilterPanel";
import { GoogleMap } from "./GoogleMap";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { Pagination } from "./Pagination";
import { SalonList } from "./SalonList";
import { SearchBar } from "./SearchBar";

type SearchResultsProps = {
  category: MarketplaceCategory;
  /** Optional SSR payload — avoids mock data and speeds first paint */
  initialResult?: SearchSalonsResult | null;
};

/**
 * Shared category search results shell.
 * Works for /hair, /nails, /spa, /barber, /massage, …
 */
export function SearchResults({
  category,
  initialResult = null,
}: SearchResultsProps) {
  const router = useRouter();
  const [showMapMobile, setShowMapMobile] = useState(false);
  const {
    query,
    filters,
    salons,
    total,
    page,
    pageSize,
    hasMore,
    origin,
    status,
    error,
    setLocation,
    setFilters,
    setPage,
    retry,
    clearFilters,
  } = useSalonSearch({ category, initialResult });

  const {
    selectedId,
    focusToken,
    selectSalonFromCard,
    selectSalonFromMarker,
    clearSelection,
  } = useMap(salons);

  useEffect(() => {
    clearSelection();
  }, [
    query.location,
    query.radiusKm,
    filters.suburb,
    filters.minRating,
    filters.verifiedOnly,
    filters.openNow,
    page,
    clearSelection,
  ]);

  const pageTitle = buildCategoryResultsTitle(
    category,
    filters.suburb || query.location,
  );
  const locationLabel = formatLocationDisplay(
    filters.suburb || query.location,
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  function openSalon(id: string) {
    const salon = salons.find((row) => row.id === id);
    if (!salon?.slug) return;
    router.push(`/${category.slug}/${encodeURIComponent(salon.slug)}`);
  }

  function onCategoryChange(service: string) {
    const next = resolveCategoryFromService(service);
    if (!next || next.slug === category.slug) return;
    const params = new URLSearchParams();
    if (query.location) params.set("location", query.location.toLowerCase());
    if (filters.suburb) params.set("suburb", filters.suburb);
    const qs = params.toString();
    router.push(`/${next.slug}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-white text-neutral-950">
      <header className="z-40 shrink-0 border-b border-neutral-200/80 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <AllBookLogo
              size="sm"
              variant="blue"
              className="[&_span]:!text-neutral-950"
            />
          </Link>
          <div className="hidden min-w-0 flex-1 justify-center px-4 xl:flex">
            <div className="w-full max-w-3xl">
              <SearchBar
                location={locationLabel}
                category={category.service}
                lockCategory
                onLocationChange={setLocation}
                onCategoryChange={onCategoryChange}
                onSearch={() => undefined}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowMapMobile((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-[13px] font-semibold text-neutral-600 transition hover:border-neutral-300 lg:hidden"
            >
              {showMapMobile ? (
                <>
                  <List className="size-3.5" />
                  List
                </>
              ) : (
                <>
                  <MapIcon className="size-3.5" />
                  Map
                </>
              )}
            </button>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-full bg-neutral-950 px-3.5 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
            >
              Start Free
            </Link>
          </div>
        </div>

        <div className="border-t border-neutral-100 px-4 py-3 sm:px-6 xl:hidden">
          <SearchBar
            location={locationLabel}
            category={category.service}
            lockCategory
            onLocationChange={setLocation}
            onCategoryChange={onCategoryChange}
            onSearch={() => undefined}
          />
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1">
        <section
          className={cn(
            "flex min-h-0 w-full flex-col lg:w-[45%] lg:max-w-[45%] lg:border-r lg:border-neutral-200/80",
            showMapMobile && "hidden lg:flex",
          )}
        >
          <div className="shrink-0 space-y-3 px-4 pb-2 pt-5 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                {category.label}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                {status === "loading" ? "Searching…" : pageTitle}
              </h1>
              <p className="mt-0.5 text-sm text-neutral-500">
                {status === "ready"
                  ? `${total} salon${total === 1 ? "" : "s"}`
                  : "Find and book nearby"}
                {query.location ? ` · within ${query.radiusKm} km` : null}
              </p>
              {origin?.formattedAddress ? (
                <p className="mt-0.5 truncate text-xs text-neutral-400">
                  Near {origin.formattedAddress}
                </p>
              ) : null}
            </div>

            <FilterPanel
              values={{
                suburb: filters.suburb,
                minRating: filters.minRating,
                verifiedOnly: filters.verifiedOnly,
                openNow: filters.openNow,
              }}
              onChange={setFilters}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
            {status === "loading" ? (
              <LoadingSkeleton count={5} />
            ) : status === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
                <p className="text-sm font-semibold text-rose-700">
                  Couldn’t search salons
                </p>
                <p className="mt-2 text-sm text-rose-600/90">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            ) : salons.length === 0 ? (
              <EmptyState
                discovering={Boolean(
                  query.location.trim() ||
                    (query.lat != null && query.lng != null),
                )}
                locationLabel={locationLabel}
                onRetry={retry}
                onReset={clearFilters}
              />
            ) : (
              <>
                <SalonList
                  salons={salons}
                  categorySlug={category.slug}
                  selectedId={selectedId}
                  onSelect={selectSalonFromCard}
                  onBook={openSalon}
                />
                <Pagination
                  className="mt-6"
                  page={page}
                  totalPages={
                    hasMore ? Math.max(totalPages, page + 1) : totalPages
                  }
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </section>

        <aside
          className={cn(
            "min-h-0 flex-1 p-3 sm:p-4",
            showMapMobile ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="sticky top-0 h-full w-full min-h-[calc(100svh-8rem)]">
            <GoogleMap
              key={[
                query.location,
                query.lat ?? "",
                query.lng ?? "",
                query.radiusKm,
              ].join("|")}
              salons={status === "ready" ? salons : []}
              selectedId={selectedId}
              focusToken={focusToken}
              searchLocation={locationLabel}
              searchOrigin={
                origin
                  ? { lat: origin.lat, lng: origin.lng }
                  : null
              }
              radiusKm={query.radiusKm}
              onSelect={selectSalonFromMarker}
              className="h-full min-h-[calc(100svh-8.5rem)] rounded-2xl"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** @deprecated Use SearchResults — kept for import compatibility */
export const SearchPage = SearchResults;
