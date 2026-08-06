"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { List, Map as MapIcon } from "lucide-react";

import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";
import { SERVICE_TO_TAGS, parseSearchParams } from "@/lib/search";
import { cn } from "@/lib/utils";

import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { MapPlaceholder } from "./MapPlaceholder";
import { MOCK_SALONS } from "./mock-salons";
import { SalonList } from "./SalonList";
import { SearchToolbar } from "./SearchToolbar";

const ACCENT = "#6B5CF6";

function filterMockSalons(location: string, service: string) {
  const q = location.trim().toLowerCase();

  return MOCK_SALONS.filter((salon) => {
    if (q) {
      const haystack =
        `${salon.name} ${salon.address} ${salon.suburb}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (service) {
      const tags = SERVICE_TO_TAGS[service] ?? [service];
      if (!tags.some((tag) => salon.tags.includes(tag as never))) {
        return false;
      }
    }

    return true;
  });
}

export function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);

  const salons = useMemo(
    () => filterMockSalons(query.location, query.service),
    [query.location, query.service],
  );

  useEffect(() => {
    setLoading(true);
    setSelectedId(null);
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, [query.location, query.service]);

  useEffect(() => {
    if (loading) return;
    setSelectedId((prev) => {
      if (prev && salons.some((s) => s.id === prev)) return prev;
      return salons[0]?.id ?? null;
    });
  }, [loading, salons]);

  const resultHint = [
    query.location || null,
    query.service || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-white text-neutral-950">
      {/* Sticky header + shared hero search UI */}
      <header className="z-40 shrink-0 border-b border-neutral-200/80 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <AllBookLogo
              size="sm"
              variant="blue"
              className="[&_span]:!text-neutral-950"
            />
          </Link>
          <div className="hidden min-w-0 flex-1 justify-center px-6 lg:flex">
            <div className="w-full max-w-2xl">
              <SearchToolbar
                location={query.location}
                service={query.service}
                className="[&>form]:shadow-[0_8px_30px_rgba(27,31,59,0.06)]"
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

        {/* Mobile / tablet toolbar */}
        <div className="border-t border-neutral-100 px-4 py-3 sm:px-6 lg:hidden">
          <SearchToolbar location={query.location} service={query.service} />
        </div>
      </header>

      {/* Airbnb-style split: list 45% | sticky map 55% */}
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
              {loading
                ? "Searching…"
                : `${salons.length} salon${salons.length === 1 ? "" : "s"}`}
            </h1>
            {resultHint ? (
              <p className="mt-0.5 text-sm text-neutral-500">{resultHint}</p>
            ) : (
              <p className="mt-0.5 text-sm text-neutral-500">
                Explore mock salons near Brisbane
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
            {loading ? (
              <LoadingSkeleton count={5} />
            ) : salons.length === 0 ? (
              <EmptyState onReset={() => router.push("/search")} />
            ) : (
              <SalonList
                salons={salons}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onBook={() => {
                  /* mock only */
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
            <MapPlaceholder
              salons={loading ? [] : salons}
              selectedId={selectedId}
              onSelect={setSelectedId}
              className="h-full min-h-[calc(100svh-8.5rem)] rounded-2xl"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
