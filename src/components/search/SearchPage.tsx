"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { List, Map as MapIcon } from "lucide-react";

import { GoogleMap } from "@/components/maps";
import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";
import { useMap } from "@/hooks/useMap";
import { parseSearchParams } from "@/lib/search";
import { cn } from "@/lib/utils";
import type { Salon } from "@/types/salon";

import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { SalonList } from "./SalonList";
import { SearchToolbar } from "./SearchToolbar";

const ACCENT = "#6B5CF6";

type LoadState = "loading" | "ready" | "error";

export function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );

  const [salons, setSalons] = useState<Salon[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showMapMobile, setShowMapMobile] = useState(false);

  const {
    selectedId,
    focusToken,
    selectSalonFromCard,
    selectSalonFromMarker,
    clearSelection,
  } = useMap(salons);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoadState("loading");
      setErrorMessage(null);
      clearSelection();

      const params = new URLSearchParams();
      if (query.location) params.set("location", query.location);
      if (query.service) params.set("service", query.service);

      try {
        const response = await fetch(
          `/api/salons${params.size ? `?${params}` : ""}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = (await response.json()) as {
          salons?: Salon[];
          error?: string | null;
        };

        if (cancelled) return;

        if (!response.ok || data.error) {
          setSalons([]);
          setErrorMessage(data.error || "Failed to load salons");
          setLoadState("error");
          return;
        }

        setSalons(data.salons ?? []);
        setLoadState("ready");
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setSalons([]);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load salons",
        );
        setLoadState("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query.location, query.service, clearSelection, retryKey]);

  const resultHint = [query.location || null, query.service || null]
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

        <div className="border-t border-neutral-100 px-4 py-3 sm:px-6 lg:hidden">
          <SearchToolbar location={query.location} service={query.service} />
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
              {loadState === "loading"
                ? "Searching…"
                : `${salons.length} salon${salons.length === 1 ? "" : "s"}`}
            </h1>
            {resultHint ? (
              <p className="mt-0.5 text-sm text-neutral-500">{resultHint}</p>
            ) : (
              <p className="mt-0.5 text-sm text-neutral-500">
                Salons near Brisbane
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
            {loadState === "loading" ? (
              <LoadingSkeleton count={5} />
            ) : loadState === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
                <p className="text-sm font-semibold text-rose-700">
                  Couldn’t load salons
                </p>
                <p className="mt-2 text-sm text-rose-600/90">
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setRetryKey((n) => n + 1)}
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            ) : salons.length === 0 ? (
              <EmptyState onReset={() => router.push("/search")} />
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
              salons={loadState === "ready" ? salons : []}
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
