"use client";

import { useMemo, useState } from "react";

import { upcomingWeekday } from "@/features/marketplace-matching/demo-seed-data";

type MatchRow = {
  partnerId: string;
  displayName: string;
  serviceName: string;
  priceCents: number | null;
  score: number;
  scoreBreakdown: Record<string, unknown>;
  locationLabel: string;
  preferredTime: string;
};

type ExcludedRow = {
  partnerId: string;
  displayName: string;
  serviceName: string | null;
  exclusionReason: string;
};

const PRESETS = [
  {
    id: "lawn-aspley",
    label: "Lawn mowing · Aspley · 2pm · under $80",
    rawQuery:
      "I need someone tomorrow at 2pm in Aspley to mow my lawn for under $80.",
    request: {
      serviceCategory: "lawn_care",
      serviceSlug: "lawn_mowing",
      locationLabel: "Aspley",
      preferredDay: 1,
      preferredTime: "14:00",
      budgetCentsMax: 8000,
      urgency: "normal" as const,
    },
  },
  {
    id: "cleaning-aspley",
    label: "House cleaning · Aspley · 2pm · under $80",
    rawQuery: "House cleaning in Aspley at 2pm under $80",
    request: {
      serviceCategory: "cleaning",
      serviceSlug: "house_cleaning",
      locationLabel: "Aspley",
      preferredDay: 2,
      preferredTime: "14:00",
      budgetCentsMax: 8000,
      urgency: "normal" as const,
    },
  },
  {
    id: "nail-chermside",
    label: "Nail trim · Chermside · 2pm · under $30",
    rawQuery: "Nail trim in Chermside at 2pm under $30",
    request: {
      serviceCategory: "nail",
      serviceSlug: "nail_trim",
      locationLabel: "Chermside",
      preferredDay: 3,
      preferredTime: "14:00",
      budgetCentsMax: 3000,
      urgency: "normal" as const,
    },
  },
  {
    id: "car-sat",
    label: "Car wash · Aspley · Sat 2pm · under $70",
    rawQuery: "Mobile car wash in Aspley Saturday 2pm under $70",
    request: {
      serviceCategory: "automotive",
      serviceSlug: "mobile_car_wash",
      locationLabel: "Aspley",
      preferredDay: 6,
      preferredTime: "14:00",
      budgetCentsMax: 7000,
      urgency: "normal" as const,
    },
  },
] as const;

export function MarketplaceDemoPanel() {
  const [presetId, setPresetId] = useState<string>("lawn-aspley");
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [rawQuery, setRawQuery] = useState<string>(preset.rawQuery);
  const [showWhyNot, setShowWhyNot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [excluded, setExcluded] = useState<ExcludedRow[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);

  const preferredDate = useMemo(() => {
    return upcomingWeekday(preset.request.preferredDay);
  }, [preset.request.preferredDay]);

  async function findMatches() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/marketplace/demo/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persist: true,
          request: {
            ...preset.request,
            rawQuery,
            preferredDate,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Match failed.");
      setMatches(data.matches ?? []);
      setExcluded(data.excluded ?? []);
      setRequestId(data.requestId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
          Dev demo only — no payments, bookings, or partner notifications
        </p>
        <h1 className="text-2xl font-semibold text-stone-900">
          Marketplace matching demo
        </h1>
        <p className="text-sm text-stone-600">
          Rule-based matching against live Partner rows in Supabase. No AI /
          LLM.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-medium">Customer request</h2>
        <label className="block text-sm text-stone-700">
          Preset
          <select
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={presetId}
            onChange={(e) => {
              const next = PRESETS.find((p) => p.id === e.target.value);
              if (!next) return;
              setPresetId(next.id);
              setRawQuery(next.rawQuery);
              setMatches([]);
              setExcluded([]);
            }}
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="w-full rounded-xl border border-stone-300 px-3 py-3 text-sm"
          rows={4}
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
        />
        <pre className="overflow-x-auto rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
{JSON.stringify({ ...preset.request, preferredDate, rawQuery }, null, 2)}
        </pre>
        <button
          type="button"
          disabled={busy}
          onClick={() => void findMatches()}
          className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Matching…" : "Find Matches"}
        </button>
        {requestId ? (
          <p className="text-xs text-stone-500">Saved request id: {requestId}</p>
        ) : null}
        {error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">
          Recommended partners
        </h2>
        {!matches.length ? (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
            No matches yet — run Find Matches.
          </p>
        ) : (
          <ul className="space-y-3">
            {matches.map((m) => (
              <li
                key={`${m.partnerId}-${m.serviceName}`}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-stone-900">
                      {m.displayName}
                    </h3>
                    <p className="text-sm text-stone-600">{m.serviceName}</p>
                    <p className="mt-1 text-sm text-stone-800">
                      {m.priceCents != null
                        ? `$${(m.priceCents / 100).toFixed(0)}`
                        : "Quote"}{" "}
                      · {m.locationLabel} · Available at {m.preferredTime}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Score {m.score}
                    </p>
                  </div>
                  <a
                    href={`/api/marketplace/partners/public/${m.partnerId}`}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-800"
                  >
                    View Partner
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <button
          type="button"
          className="text-sm text-stone-600 underline"
          onClick={() => setShowWhyNot((v) => !v)}
        >
          {showWhyNot ? "Hide" : "Show"} why not matched (dev)
        </button>
        {showWhyNot ? (
          <ul className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm">
            {excluded.map((e) => (
              <li key={`${e.partnerId}-${e.exclusionReason}`}>
                <span className="font-medium">{e.displayName}</span>
                {e.serviceName ? ` · ${e.serviceName}` : ""} —{" "}
                <span className="text-rose-700">{e.exclusionReason}</span>
              </li>
            ))}
            {!excluded.length ? <li>No exclusions recorded.</li> : null}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
