"use client";

import { Search } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  KoreanSearchHit,
  KoreanSearchIntent,
  KoreanSearchOrigin,
} from "@/features/korean-search";
import { formatKoreanSearchCriteria } from "@/features/korean-search";

import { AllBookLogo } from "./allbook-logo";
import { KoreanSearchResults } from "./korean-search-results";

const QUICK_MENUS = ["FREE", "예약", "내 주변", "DEAL"] as const;

const EXAMPLE_QUERIES = [
  "싼 미용실 찾아줘",
  "평점 높은 미용실",
  "Sunnybank 근처 미용실",
  "오늘 예약 가능한 미용실",
  "가까운 미용실 찾아줘",
] as const;

function wantsNearby(text: string) {
  return /가까운|근처|내 주변|가까이|near me|nearby|closest/i.test(text);
}

function requestBrowserOrigin(): Promise<KoreanSearchOrigin | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60_000 },
    );
  });
}

/**
 * Search-first home for kor.allbook.com.au only.
 */
export function KoreanPlatformLanding() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<KoreanSearchIntent | null>(null);
  const [results, setResults] = useState<KoreanSearchHit[] | null>(null);
  const [total, setTotal] = useState(0);

  const [origin, setOrigin] = useState<KoreanSearchOrigin | null>(null);
  const [bookableOnly, setBookableOnly] = useState(false);

  const hasResults = results != null;

  async function runSearch(nextQuery: string, nextBookableOnly = bookableOnly) {
    const q = nextQuery.trim();
    if (!q) return;
    setBusy(true);
    setError(null);
    try {
      const geo = wantsNearby(q) ? await requestBrowserOrigin() : null;
      const response = await fetch("/api/kor/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          lat: geo?.lat,
          lng: geo?.lng,
          bookableOnly: nextBookableOnly,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        intent?: KoreanSearchIntent;
        origin?: KoreanSearchOrigin | null;
        results?: KoreanSearchHit[];
        total?: number;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "검색에 실패했습니다.");
      }
      setIntent(data.intent ?? null);
      setOrigin(data.origin ?? geo ?? null);
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
      if (data.intent?.bookableOnly != null) {
        setBookableOnly(data.intent.bookableOnly);
      }
    } catch (err) {
      setIntent(null);
      setOrigin(null);
      setResults(null);
      setError(err instanceof Error ? err.message : "검색에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  function onQuickMenu(label: (typeof QUICK_MENUS)[number]) {
    if (label === "내 주변") {
      const next = "가까운 미용실 찾아줘";
      setQuery(next);
      void runSearch(next, bookableOnly);
    }
    if (label === "예약") {
      const next = query.trim() || "미용실 찾아줘";
      setQuery(next);
      setBookableOnly(true);
      void runSearch(next, true);
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-white text-neutral-950">
      <main
        className={`mx-auto flex w-full flex-1 flex-col px-5 sm:px-6 ${
          hasResults
            ? "max-w-6xl items-stretch justify-start py-8"
            : "max-w-xl items-center justify-center py-16"
        }`}
      >
        <AllBookLogo
          size={hasResults ? "md" : "lg"}
          variant="blue"
          layout="vertical"
          className={hasResults ? "mb-5 self-center" : "mb-8 self-center sm:mb-10"}
        />

        {!hasResults ? (
          <h1 className="text-center text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[1.75rem]">
            무엇을 찾고 계세요?
          </h1>
        ) : null}

        <form onSubmit={onSearch} className={`w-full ${hasResults ? "mt-0" : "mt-7 sm:mt-8"}`}>
          <label htmlFor="kor-home-search" className="sr-only">
            검색
          </label>
          <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] focus-within:border-neutral-400 focus-within:shadow-[0_10px_36px_rgba(15,23,42,0.1)]">
            <Search
              className="ml-1 size-5 shrink-0 text-neutral-400"
              aria-hidden
            />
            <Input
              id="kor-home-search"
              name="q"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              enterKeyHint="search"
              autoComplete="off"
              placeholder="싼 미용실 찾아줘"
              className="h-11 border-0 bg-transparent px-1 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 md:h-12 md:text-base dark:bg-transparent"
            />
            <Button
              type="submit"
              disabled={busy}
              className="mr-0.5 h-10 rounded-full px-4 sm:px-5"
            >
              {busy ? "검색 중" : "검색"}
            </Button>
          </div>
        </form>

        <nav
          aria-label="빠른 메뉴"
          className="mt-6 flex w-full flex-wrap items-center justify-center gap-2"
        >
          {QUICK_MENUS.map((label) => (
            <Button
              key={label}
              type="button"
              variant="secondary"
              className="h-9 rounded-full px-4 text-[13px] font-medium tracking-wide"
              onClick={() => onQuickMenu(label)}
            >
              {label}
            </Button>
          ))}
        </nav>

        {!hasResults ? (
          <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                onClick={() => {
                  setQuery(example);
                  void runSearch(example);
                }}
              >
                {example}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="mt-6 text-center text-sm text-red-600">{error}</p>
        ) : null}

        {results ? (
          <section className="mt-8 w-full" aria-live="polite">
            <p className="text-sm text-neutral-500">{total}곳</p>
            {intent ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {formatKoreanSearchCriteria(intent).map((chip) => (
                  <li
                    key={chip.key}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700"
                  >
                    <span className="text-neutral-400">{chip.label}</span>
                    <span className="ml-1.5 font-medium text-neutral-900">
                      {chip.value}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <KoreanSearchResults
              results={results}
              total={total}
              intent={intent}
              origin={origin}
              bookableOnly={bookableOnly}
              onBookableOnlyChange={(next) => {
                setBookableOnly(next);
                void runSearch(query, next);
              }}
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
