"use client";

import { History, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import type {
  GoogleSyncRunSummary,
  GoogleSyncScope,
  GoogleSyncTotals,
} from "./types";
import { EMPTY_SYNC_TOTALS } from "./types";

const AU_STATES = [
  "Queensland",
  "New South Wales",
  "Victoria",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",
];

type HistoryItem = {
  id: string;
  salonId: string | null;
  placeId: string | null;
  businessName: string | null;
  result: string;
  changedFields: string[];
  error: string | null;
};

function TotalsCards({ totals }: { totals: GoogleSyncTotals }) {
  const cards = [
    { label: "Updated", value: totals.updated, tone: "text-emerald-700" },
    { label: "No Changes", value: totals.unchanged, tone: "text-slate-600" },
    { label: "Failed", value: totals.failed, tone: "text-rose-700" },
    { label: "Closed", value: totals.closed, tone: "text-amber-700" },
    { label: "Missing", value: totals.missing, tone: "text-orange-700" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3"
        >
          <p className="text-xs font-medium text-slate-500">{card.label}</p>
          <p className={cn("mt-1 text-2xl font-semibold tabular-nums", card.tone)}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AdminGoogleSyncPanel() {
  const [scope, setScope] = useState<GoogleSyncScope>("city");
  const [country, setCountry] = useState("Australia");
  const [state, setState] = useState("Queensland");
  const [city, setCity] = useState("Brisbane");
  const [salonId, setSalonId] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<GoogleSyncRunSummary | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [history, setHistory] = useState<GoogleSyncRunSummary[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/platform/sync/google/history");
      const data = (await response.json()) as {
        error?: string;
        runs?: GoogleSyncRunSummary[];
      };
      if (!response.ok) throw new Error(data.error || "Failed to load history.");
      setHistory(data.runs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history.");
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function refreshRun(runId: string) {
    const response = await fetch(`/api/platform/sync/google/${runId}`);
    const data = (await response.json()) as {
      error?: string;
      run?: GoogleSyncRunSummary;
      items?: HistoryItem[];
    };
    if (!response.ok) throw new Error(data.error || "Failed to load run.");
    if (data.run) setActiveRun(data.run);
    if (data.items) setItems(data.items);
    return data.run;
  }

  async function drainRun(runId: string) {
    let done = false;
    while (!done) {
      const response = await fetch("/api/platform/sync/google/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, batchSize: 8 }),
      });
      const data = (await response.json()) as {
        error?: string;
        run?: GoogleSyncRunSummary;
        done?: boolean;
        label?: string;
      };
      if (!response.ok) throw new Error(data.error || "Sync batch failed.");
      if (data.run) setActiveRun(data.run);
      setProgressLabel(
        data.label ??
          `Processed ${data.run?.totals.processed ?? 0} / ${data.run?.totals.queued ?? 0}`,
      );
      done = Boolean(data.done);
      await refreshRun(runId);
    }
  }

  async function startSync() {
    setError(null);
    setBusy(true);
    setProgressLabel("Creating sync run…");
    setItems([]);
    try {
      const body: Record<string, unknown> = {
        scope,
        country,
        processNow: false,
      };
      if (scope === "single") {
        if (!salonId.trim()) throw new Error("Salon ID is required.");
        body.salonId = salonId.trim();
      } else if (scope === "city" || scope === "scheduled") {
        body.state = state;
        body.city = city;
      } else if (scope === "state") {
        body.state = state;
      }

      const response = await fetch("/api/platform/sync/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        error?: string;
        run?: GoogleSyncRunSummary;
      };
      if (!response.ok) throw new Error(data.error || "Failed to start sync.");
      if (!data.run) throw new Error("No sync run returned.");

      setActiveRun(data.run);
      setProgressLabel(
        `Queued ${data.run.totals.queued} businesses — syncing…`,
      );
      await drainRun(data.run.id);
      await loadHistory();
      setProgressLabel("Sync complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setBusy(false);
    }
  }

  async function openHistoryRun(runId: string) {
    setError(null);
    try {
      await refreshRun(runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open run.");
    }
  }

  const totals = activeRun?.totals ?? EMPTY_SYNC_TOTALS;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <p className="text-sm text-slate-600">
          Google is the source of truth only for Google snapshot fields. Owner
          services, prices, staff, keywords, description, cover, logo, booking
          settings, amenities, and AllBook categories are never overwritten.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Scope</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={scope}
              disabled={busy}
              onChange={(e) => setScope(e.target.value as GoogleSyncScope)}
            >
              <option value="single">Manual — single business</option>
              <option value="city">Bulk — city</option>
              <option value="state">Bulk — state</option>
              <option value="scheduled">Scheduled — city</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Country</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={country}
              disabled={busy}
              onChange={(e) => setCountry(e.target.value)}
            />
          </label>

          {scope !== "single" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">State</span>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={state}
                disabled={busy}
                onChange={(e) => setState(e.target.value)}
              >
                {AU_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {scope === "city" || scope === "scheduled" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">City</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={city}
                disabled={busy}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
          ) : null}

          {scope === "single" ? (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">
                Salon ID
              </span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                value={salonId}
                disabled={busy}
                placeholder="uuid of imported salon"
                onChange={(e) => setSalonId(e.target.value)}
              />
            </label>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startSync()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {busy ? "Syncing…" : "Start sync"}
          </button>
          {progressLabel ? (
            <p className="text-sm text-slate-600">{progressLabel}</p>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Sync report</h2>
        <TotalsCards totals={totals} />
        {activeRun ? (
          <p className="text-xs text-slate-500">
            Run {activeRun.id.slice(0, 8)}… · {activeRun.status} ·{" "}
            {activeRun.totals.processed}/{activeRun.totals.queued} processed
          </p>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
            Latest run items
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Business</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Changed</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-800">
                        {item.businessName || "—"}
                      </div>
                      {item.error ? (
                        <div className="text-xs text-rose-600">{item.error}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 capitalize text-slate-700">
                      {item.result === "unchanged" ? "no changes" : item.result}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {item.changedFields?.length
                        ? item.changedFields.join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <History className="size-4" />
            Sync history
          </div>
          <button
            type="button"
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
            onClick={() => void loadHistory()}
          >
            Refresh
          </button>
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Scope</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Report</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No sync runs yet.
                  </td>
                </tr>
              ) : (
                history.map((run) => (
                  <tr key={run.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() => void openHistoryRun(run.id)}
                      >
                        {new Date(run.createdAt).toLocaleString()}
                      </button>
                    </td>
                    <td className="px-3 py-2 capitalize text-slate-700">
                      {run.scope}
                      {run.city ? ` · ${run.city}` : ""}
                      {run.state && !run.city ? ` · ${run.state}` : ""}
                    </td>
                    <td className="px-3 py-2 capitalize text-slate-700">
                      {run.status}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      U {run.totals.updated} · N {run.totals.unchanged} · F{" "}
                      {run.totals.failed} · C {run.totals.closed} · M{" "}
                      {run.totals.missing}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
