"use client";

import Link from "next/link";
import { useState } from "react";

const EXAMPLES = [
  "I need someone tomorrow at 2pm in Aspley to mow my lawn for under $80.",
  "Looking for dog grooming available today",
  "Nail service near Aspley for under $30",
  "Need a house cleaner available this weekend",
  "I need an electrician ASAP",
  "I need house cleaning in Aspley for under $80.",
  "Looking for a nail service in Chermside for under $30.",
  "I want a car wash in Aspley on Saturday at 2pm for under $70.",
  "I need lawn mowing in Chermside for under $80.",
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
  excluded?: Array<{
    displayName: string;
    exclusionReason: string;
    serviceName: string | null;
  }>;
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

/**
 * Customer Marketplace search — “what do you need help with?”
 * Demo parser + rule-based matching (no AI).
 */
export function MarketplaceSearchPage() {
  const [query, setQuery] = useState(
    "I need someone tomorrow at 2pm in Aspley to mow my lawn for under $80.",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [showDev, setShowDev] = useState(false);

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
        setError(data.error || "Could not understand that request yet.");
        setHints(data.hints ?? []);
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(ellipse_at_top,_#f7f3ea_0%,_#eef2f0_45%,_#e8ece9_100%)]">
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-emerald-900/70">
          AllBook Marketplace · Phase 1 demo
        </p>
        <h1 className="max-w-xl font-serif text-4xl leading-tight tracking-tight text-stone-900 md:text-5xl">
          What do you need help with?
        </h1>
        <p className="mt-3 max-w-xl text-base text-stone-600">
          Describe the job in plain language. We match Partners who already
          publish their own services, prices, areas, and availability — not
          Google listings.
        </p>

        <div className="mt-8 rounded-3xl border border-stone-200/80 bg-white/90 p-4 shadow-[0_20px_60px_-40px_rgba(28,25,23,0.45)] backdrop-blur md:p-5">
          <label className="sr-only" htmlFor="marketplace-query">
            Service request
          </label>
          <textarea
            id="marketplace-query"
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. I need someone tomorrow at 2pm in Aspley to mow my lawn for under $80."
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
          <section className="mt-10 space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xl font-semibold text-stone-900">
                Available Partners
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
              <ul className="space-y-4">
                {result.matches.map((m) => (
                  <li
                    key={`${m.partnerId}-${m.serviceName}`}
                    className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
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
                          {m.locationLabel}
                          {" · "}
                          Available
                          {m.preferredDate ? ` ${m.preferredDate}` : ""} at{" "}
                          {formatTimeLabel(m.preferredTime)}
                        </p>
                        <ul className="mt-3 space-y-1 text-sm text-emerald-900">
                          {m.explanations.map((line) => (
                            <li key={line}>✓ {line}</li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-stone-400">
                          Match score {m.score}
                        </p>
                      </div>
                      <Link
                        href={m.detailPath}
                        className="rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 hover:bg-stone-50"
                      >
                        View details
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
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
