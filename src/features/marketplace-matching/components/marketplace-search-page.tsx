"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PartnerResultsMap } from "@/features/marketplace-matching/components/partner-results-map";

const EXAMPLES = [
  "I need a haircut in Bridgeman Downs tomorrow at 2pm.",
  "Looking for a disability accessible haircut in Bridgeman Downs.",
  "Haircut in Bridgeman Downs with kids care.",
  "I need a haircut in Bridgeman Downs with parking.",
  "I need someone tomorrow at 2pm in Aspley to mow my lawn for under $80.",
  "Looking for a nail service in Chermside for under $30.",
] as const;

type MatchCard = {
  partnerId: string;
  displayName: string;
  serviceName: string;
  priceCents: number | null;
  pricingType: string;
  score: number;
  explanations: string[];
  locationLabel: string;
  preferredTime: string;
  preferredDate?: string | null;
  detailPath: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  amenities?: string[];
};

type SearchResponse = {
  ok?: boolean;
  error?: string;
  hints?: string[];
  parserId?: string;
  parsed?: {
    request: Record<string, unknown>;
    notes: string[];
    confidence: number;
  };
  matches?: MatchCard[];
  noMatchSummary?: {
    headline: string;
    reasons: Array<{ code: string; label: string; count: number }>;
  } | null;
};

function formatMoney(cents: number | null, pricingType: string) {
  if (pricingType === "quote" || cents == null) return "Quote";
  return `$${(cents / 100).toFixed(0)}`;
}

function formatTimeLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

function amenityLabel(flag: string) {
  switch (flag) {
    case "disability_accessible":
      return "Disability accessible";
    case "kids_care":
      return "Kids care";
    case "parking":
      return "Parking";
    default:
      return flag;
  }
}

/**
 * Customer Marketplace search — list (left) + map (right).
 */
export function MarketplaceSearchPage() {
  const [query, setQuery] = useState(
    "I need a haircut in Bridgeman Downs tomorrow at 2pm.",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDev, setShowDev] = useState(false);

  const pins = useMemo(() => {
    return (result?.matches ?? [])
      .filter(
        (m) =>
          m.latitude != null &&
          m.longitude != null &&
          Number.isFinite(m.latitude) &&
          Number.isFinite(m.longitude),
      )
      .map((m) => ({
        id: m.partnerId,
        name: m.displayName,
        latitude: m.latitude as number,
        longitude: m.longitude as number,
        priceLabel: formatMoney(m.priceCents, m.pricingType),
      }));
  }, [result?.matches]);

  async function search() {
    setBusy(true);
    setError(null);
    setHints([]);
    try {
      const response = await fetch("/api/marketplace/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, persist: true }),
      });
      const data = (await response.json()) as SearchResponse;
      if (response.status === 422) {
        setResult(null);
        setSelectedId(null);
        setError(data.error || "Could not understand that request yet.");
        setHints(data.hints ?? []);
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }
      setResult(data);
      setSelectedId(data.matches?.[0]?.partnerId ?? null);
    } catch (err) {
      setResult(null);
      setSelectedId(null);
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(ellipse_at_top,_#f7f3ea_0%,_#eef2f0_45%,_#e8ece9_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-emerald-900/70">
          AllBook Marketplace · Phase 1 demo
        </p>
        <h1 className="max-w-xl font-serif text-4xl leading-tight tracking-tight text-stone-900 md:text-5xl">
          What do you need help with?
        </h1>
        <p className="mt-3 max-w-2xl text-base text-stone-600">
          Describe the job in plain language. Results show matching Partners on
          the left and on the map.
        </p>

        <div className="mt-8 rounded-3xl border border-stone-200/80 bg-white/90 p-4 shadow-[0_20px_60px_-40px_rgba(28,25,23,0.45)] backdrop-blur md:p-5">
          <label className="sr-only" htmlFor="marketplace-query">
            Service request
          </label>
          <textarea
            id="marketplace-query"
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. I need a haircut in Bridgeman Downs tomorrow at 2pm."
            className="w-full resize-y rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-base text-stone-900 outline-none ring-emerald-700/30 placeholder:text-stone-400 focus:ring-2"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || !query.trim()}
              onClick={() => void search()}
              className="rounded-2xl bg-emerald-900 px-5 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-emerald-800 disabled:opacity-50"
            >
              {busy ? "Finding…" : "Find Available"}
            </button>
            <span className="text-xs text-stone-500">
              Demo parser · rule-based matching · no AI yet
            </span>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-stone-700">Try an example</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setQuery(example);
                  setResult(null);
                  setSelectedId(null);
                  setError(null);
                }}
                className="max-w-full rounded-full border border-stone-300/90 bg-white/70 px-3 py-1.5 text-left text-xs text-stone-700 transition hover:border-emerald-800/40 hover:bg-white"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <p>{error}</p>
            {hints.length ? (
              <ul className="mt-2 list-disc pl-5 text-rose-800">
                {hints.map((h) => (
                  <li key={h}>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setQuery(h)}
                    >
                      {h}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {result?.ok ? (
          <section className="mt-8 space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xl font-semibold text-stone-900">
                Available Partners
                {result.matches?.length
                  ? ` (${result.matches.length})`
                  : ""}
              </h2>
              <button
                type="button"
                className="text-xs text-stone-500 underline"
                onClick={() => setShowDev((v) => !v)}
              >
                {showDev ? "Hide" : "Show"} parsed request
              </button>
            </div>

            {showDev && result.parsed ? (
              <pre className="overflow-x-auto rounded-2xl bg-stone-900 p-4 text-xs text-stone-100">
{JSON.stringify(
  {
    parserId: result.parserId,
    ...result.parsed,
  },
  null,
  2,
)}
              </pre>
            ) : null}

            {result.matches && result.matches.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
                <ul className="space-y-3">
                  {result.matches.map((m) => {
                    const active = m.partnerId === selectedId;
                    return (
                      <li key={`${m.partnerId}-${m.serviceName}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(m.partnerId)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${
                            active
                              ? "border-emerald-800 bg-white shadow-md ring-1 ring-emerald-800/20"
                              : "border-stone-200 bg-white/90 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-stone-900">
                                {m.displayName}
                              </h3>
                              <p className="mt-1 text-sm text-stone-600">
                                {m.serviceName}
                              </p>
                              <p className="mt-2 text-base font-medium text-stone-900">
                                {formatMoney(m.priceCents, m.pricingType)}
                                <span className="ml-2 text-xs font-normal uppercase tracking-wide text-stone-500">
                                  {m.pricingType}
                                </span>
                              </p>
                              <p className="mt-1 text-sm text-stone-600">
                                {m.address || m.locationLabel}
                              </p>
                              <p className="mt-1 text-sm text-stone-600">
                                Available
                                {m.preferredDate ? ` ${m.preferredDate}` : ""} at{" "}
                                {formatTimeLabel(m.preferredTime)}
                              </p>
                              {m.amenities?.length ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {m.amenities.map((a) => (
                                    <span
                                      key={a}
                                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-900"
                                    >
                                      {amenityLabel(a)}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              <ul className="mt-3 space-y-1 text-sm text-emerald-900">
                                {m.explanations.map((line) => (
                                  <li key={line}>✓ {line}</li>
                                ))}
                              </ul>
                            </div>
                            <Link
                              href={m.detailPath}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 hover:bg-stone-50"
                            >
                              View details
                            </Link>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="sticky top-4 h-[min(70vh,640px)]">
                  <PartnerResultsMap
                    pins={pins}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    className="h-full"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 px-5 py-8">
                <p className="font-medium text-stone-900">
                  {result.noMatchSummary?.headline ??
                    "No providers matched all of your requirements."}
                </p>
                {result.noMatchSummary?.reasons?.length ? (
                  <ul className="mt-3 space-y-1 text-sm text-stone-600">
                    {result.noMatchSummary.reasons.map((r) => (
                      <li key={r.code}>
                        · {r.label}
                        {r.count > 1 ? ` (${r.count})` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
