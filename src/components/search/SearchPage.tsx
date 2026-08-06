"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Map as MapIcon, List } from "lucide-react";

import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";
import { cn } from "@/lib/utils";

import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { MapPlaceholder } from "./MapPlaceholder";
import { MOCK_SALONS } from "./mock-salons";
import { Pagination } from "./Pagination";
import { SalonList } from "./SalonList";
import { SearchToolbar } from "./SearchToolbar";
import type { SearchFilterChip } from "./types";

const PAGE_SIZE = 4;
const ACCENT = "#6B5CF6";

function filterSalons(
  query: string,
  service: string,
  chips: SearchFilterChip[],
) {
  const q = query.trim().toLowerCase();

  return MOCK_SALONS.filter((salon) => {
    if (q) {
      const haystack = `${salon.name} ${salon.address} ${salon.suburb}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (service !== "all") {
      const serviceMap: Record<string, string[]> = {
        haircut: ["Hair"],
        colour: ["Hair"],
        nails: ["Nails"],
        massage: ["Massage"],
        facial: ["Facial"],
        waxing: ["Waxing"],
        brows: ["Brows"],
      };
      const needed = serviceMap[service] ?? [];
      if (needed.length && !needed.some((t) => salon.tags.includes(t as never))) {
        return false;
      }
    }

    for (const chip of chips) {
      if (chip === "Open Now" && !salon.isOpen) return false;
      if (chip === "Top Rated" && salon.rating < 4.8) return false;
    }

    const serviceChips = chips.filter(
      (chip): chip is Exclude<SearchFilterChip, "Open Now" | "Top Rated"> =>
        chip !== "Open Now" && chip !== "Top Rated",
    );
    if (
      serviceChips.length > 0 &&
      !serviceChips.some((chip) => salon.tags.includes(chip))
    ) {
      return false;
    }

    return true;
  });
}

export function SearchPage() {
  const [location, setLocation] = useState("Sydney NSW");
  const [service, setService] = useState("all");
  const [dateLabel] = useState("Any date");
  const [chips, setChips] = useState<SearchFilterChip[]>([]);
  const [appliedLocation, setAppliedLocation] = useState("Sydney NSW");
  const [appliedService, setAppliedService] = useState("all");
  const [appliedChips, setAppliedChips] = useState<SearchFilterChip[]>([]);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_SALONS[0]?.id ?? null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(
    () => filterSalons(appliedLocation, appliedService, appliedChips),
    [appliedLocation, appliedService, appliedChips],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const runSearch = () => {
    setLoading(true);
    startTransition(() => {
      setAppliedLocation(location);
      setAppliedService(service);
      setAppliedChips(chips);
      setPage(1);
      window.setTimeout(() => setLoading(false), 550);
    });
  };

  const toggleChip = (chip: SearchFilterChip) => {
    setChips((prev) => {
      const next = prev.includes(chip)
        ? prev.filter((c) => c !== chip)
        : [...prev, chip];
      setAppliedChips(next);
      setPage(1);
      return next;
    });
  };

  const resetFilters = () => {
    setLocation("Sydney NSW");
    setService("all");
    setChips([]);
    setAppliedLocation("Sydney NSW");
    setAppliedService("all");
    setAppliedChips([]);
    setPage(1);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 400);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-svh bg-white text-[#1B1F3B]">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-[#EEEAF8]/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <AllBookLogo size="sm" variant="blue" className="[&_span]:!text-[#1B1F3B]" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden text-[13px] font-medium text-[#5B6178] transition hover:text-[#1B1F3B] sm:inline"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-xl px-3.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* Toolbar + filters */}
      <div className="border-b border-[#F0EEF7] bg-gradient-to-b from-[#FAFAFE] to-white">
        <div className="mx-auto max-w-[1400px] space-y-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <SearchToolbar
            location={location}
            service={service}
            dateLabel={dateLabel}
            onLocationChange={setLocation}
            onServiceChange={setService}
            onDateClick={() => {
              /* placeholder — no date picker backend yet */
            }}
            onSearch={runSearch}
          />
          <div className="flex items-center justify-between gap-3">
            <FilterBar
              active={chips}
              onToggle={toggleChip}
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => setShowMapMobile((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E8E6F2] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#5B6178] shadow-sm transition hover:border-[#C9C3F5] hover:text-[#1B1F3B] md:hidden"
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
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B5CF6]">
              Sample marketplace
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              {loading
                ? "Finding salons…"
                : `${filtered.length} salon${filtered.length === 1 ? "" : "s"} near you`}
            </h1>
          </div>
          {!loading && filtered.length > 0 ? (
            <p className="text-sm text-[#6B7289]">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
          ) : null}
        </div>

        {/* Tablet: map on top */}
        <div className="mb-5 hidden md:block lg:hidden">
          <MapPlaceholder
            salons={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            className="h-[280px]"
          />
        </div>

        {/* Mobile map toggle */}
        {showMapMobile ? (
          <div className="mb-5 md:hidden">
            <MapPlaceholder
              salons={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              className="h-[320px]"
            />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:items-start lg:gap-7">
          <section
            className={cn(showMapMobile && "hidden md:block")}
            aria-label="Salon results"
          >
            {loading ? (
              <LoadingSkeleton count={PAGE_SIZE} />
            ) : filtered.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              <>
                <SalonList
                  salons={pageItems}
                  selectedId={selectedId}
                  favorites={favorites}
                  onSelect={setSelectedId}
                  onFavoriteToggle={toggleFavorite}
                  onBook={() => {
                    /* sample — no booking wiring yet */
                  }}
                />
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  className="mt-8"
                />
              </>
            )}
          </section>

          {/* Desktop sticky map */}
          <aside className="hidden lg:block">
            <div className="sticky top-[5.5rem]">
              <MapPlaceholder
                salons={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                className="h-[min(72vh,720px)]"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
