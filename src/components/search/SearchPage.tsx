"use client";

import Link from "next/link";
import { useEffect } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { useState } from "react";

import { GoogleMap } from "@/components/maps";
import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";
import { useMap } from "@/hooks/useMap";
import { useSalonSearch } from "@/hooks/useSalonSearch";
import { cn } from "@/lib/utils";

import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { SalonList } from "./SalonList";
import { SearchToolbar } from "./SearchToolbar";

const ACCENT = "#6B5CF6";

export function SearchPage() {
  const [showMapMobile, setShowMapMobile] = useState(false);
  const {
    query,
    salons,
    total,
    origin,
    status,
    error,
    setLocation,
    setService,
    setRadiusKm,
    setSort,
    retry,
    clearFilters,
  } = useSalonSearch();

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
    query.service,
    query.radiusKm,
    query.sort,
    clearSelection,
  ]);

  const resultHint = [
    query.location || null,
    query.service || null,
    query.location ? `within ${query.radiusKm} km` : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
            <div className="w-full max-w-4xl">
              <SearchToolbar
                values={query}
                onLocationChange={setLocation}
                onServiceChange={setService}
                onRadiusChange={setRadiusKm}
                onSortChange={setSort}
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
              className="inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Start Free
            </Link>
          </div>
        </div>

        <div className="border-t border-neutral-100 px-4 py-3 sm:px-6 xl:hidden">
          <SearchToolbar
            values={query}
            onLocationChange={setLocation}
            onServiceChange={setService}
            onRadiusChange={setRadiusKm}
            onSortChange={setSort}
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
          <div className="shrink-0 px-4 pb-2 pt-5 sm:px-6">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#6B5CF6]">
              Search results
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              {status === "loading"
                ? "Searching…"
                : `${total} salon${total === 1 ? "" : "s"}`}
            </h1>
            {resultHint ? (
              <p className="mt-0.5 text-sm text-neutral-500">{resultHint}</p>
            ) : (
              <p className="mt-0.5 text-sm text-neutral-500">
                Salons near Brisbane
              </p>
            )}
            {origin?.formattedAddress ? (
              <p className="mt-0.5 truncate text-xs text-neutral-400">
                Near {origin.formattedAddress}
              </p>
            ) : null}
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
              <EmptyState onReset={clearFilters} />
            ) : (
              <SalonList
                salons={salons}
                selectedId={selectedId}
                onSelect={selectSalonFromCard}
                onBook={() => {
                  /* booking wiring later */
                }}
              />
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
              salons={status === "ready" ? salons : []}
              selectedId={selectedId}
              focusToken={focusToken}
              searchLocation={query.location}
              onSelect={selectSalonFromMarker}
              className="h-full min-h-[calc(100svh-8.5rem)] rounded-2xl"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
