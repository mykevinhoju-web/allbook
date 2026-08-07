"use client";

import { Download, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { MARKETPLACE_CATEGORIES } from "@/features/category";
import {
  IMPORT_SCOPE_OPTIONS,
  type GoogleImportGeoScope,
  type GoogleImportPreviewItem,
  type GoogleImportRunResult,
} from "@/features/google-import";
import { cn } from "@/lib/utils";

type Summary = {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
};

const EMPTY_SUMMARY: Summary = {
  imported: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
};

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

export function AdminGoogleImportPanel() {
  const [country, setCountry] = useState("Australia");
  const [state, setState] = useState("Queensland");
  const [city, setCity] = useState("Brisbane");
  const [suburb, setSuburb] = useState("");
  const [category, setCategory] = useState("hair");
  const [scope, setScope] = useState<GoogleImportGeoScope>("city");
  const [maxPages, setMaxPages] = useState(3);

  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<GoogleImportPreviewItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    label: string;
  } | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastResults, setLastResults] = useState<
    GoogleImportRunResult["places"]
  >([]);

  const selectableIds = useMemo(
    () => items.map((i) => i.placeId),
    [items],
  );

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(selectableIds));
  }

  function toggleOne(placeId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  async function runPreview() {
    setError(null);
    setSummary(null);
    setLastResults([]);
    setPreviewing(true);
    setProgress({ current: 0, total: 1, label: "Querying Google Places…" });
    try {
      const response = await fetch(
        "/api/platform/import/google-places/preview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country,
            state,
            city: scope === "suburb" ? suburb || city : city,
            suburb: scope === "suburb" ? suburb || city : undefined,
            category,
            scope,
            maxPages,
          }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        items?: GoogleImportPreviewItem[];
        queried?: number;
        cellsProcessed?: number;
      };
      if (!response.ok) throw new Error(data.error || "Preview failed.");
      const list = data.items ?? [];
      setItems(list);
      setSelected(
        new Set(list.filter((i) => !i.alreadyImported).map((i) => i.placeId)),
      );
      setProgress({
        current: 1,
        total: 1,
        label: `Found ${list.length} businesses (${data.cellsProcessed ?? 1} geo cell${(data.cellsProcessed ?? 1) === 1 ? "" : "s"})`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed.");
      setItems([]);
      setSelected(new Set());
      setProgress(null);
    } finally {
      setPreviewing(false);
    }
  }

  async function runImportSelected() {
    const ids = [...selected];
    if (ids.length === 0) {
      setError("Select at least one business.");
      return;
    }

    setError(null);
    setImporting(true);
    setSummary({ ...EMPTY_SUMMARY });
    setLastResults([]);

    const batchSize = 10;
    const totals: Summary = { ...EMPTY_SUMMARY };
    const allPlaces: GoogleImportRunResult["places"] = [];

    try {
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        setProgress({
          current: Math.min(i + batch.length, ids.length),
          total: ids.length,
          label: `Importing ${Math.min(i + batch.length, ids.length)} / ${ids.length}…`,
        });

        const response = await fetch(
          "/api/platform/import/google-places/commit",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              placeIds: batch,
              category,
              country,
              state,
              city: scope === "suburb" ? suburb || city : city,
            }),
          },
        );
        const data = (await response.json()) as GoogleImportRunResult & {
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || "Import failed.");

        totals.imported += data.inserted;
        totals.updated += data.updated;
        totals.skipped += data.skipped;
        totals.failed += data.failed;
        allPlaces.push(...data.places);
        setSummary({ ...totals });
        setLastResults([...allPlaces]);
      }

      setProgress({
        current: ids.length,
        total: ids.length,
        label: "Import complete",
      });
      // Refresh alreadyImported flags
      setItems((prev) =>
        prev.map((item) =>
          selected.has(item.placeId)
            ? { ...item, alreadyImported: true }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  const showLocality = scope === "suburb" || scope === "city";
  const showState = scope !== "country";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          1. Target
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Country">
            <input
              className={inputClass}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </Field>
          <Field label="Scope">
            <select
              className={inputClass}
              value={scope}
              onChange={(e) =>
                setScope(e.target.value as GoogleImportGeoScope)
              }
            >
              {IMPORT_SCOPE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {MARKETPLACE_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          {showState ? (
            <Field label="State">
              <select
                className={inputClass}
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                {AU_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {showLocality && scope === "city" ? (
            <Field label="City">
              <input
                className={inputClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Brisbane"
              />
            </Field>
          ) : null}
          {scope === "suburb" ? (
            <Field label="Suburb">
              <input
                className={inputClass}
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="Aspley"
              />
            </Field>
          ) : null}
          <Field label="Max pages / cell">
            <input
              type="number"
              min={1}
              max={10}
              className={inputClass}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value) || 1)}
            />
          </Field>
        </div>
        <p className="mt-3 text-sm text-neutral-500">
          {IMPORT_SCOPE_OPTIONS.find((o) => o.id === scope)?.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={previewing || importing}
            onClick={() => void runPreview()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {previewing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Preview Google results
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {progress ? (
        <div className="rounded-xl border border-neutral-200 bg-[#FAFBFC] px-4 py-3 text-sm text-neutral-700">
          <div className="flex items-center justify-between gap-3">
            <span>{progress.label}</span>
            <span className="tabular-nums text-neutral-500">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-neutral-950 transition-all"
              style={{
                width: `${progress.total ? (100 * progress.current) / progress.total : 0}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Imported" value={summary.imported} tone="good" />
          <Stat label="Updated" value={summary.updated} tone="info" />
          <Stat label="Skipped" value={summary.skipped} />
          <Stat label="Failed" value={summary.failed} tone="bad" />
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                2. Select businesses
              </h2>
              <p className="text-sm text-neutral-500">
                {selected.size} selected · {items.length} previewed
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="h-9 rounded-full border border-neutral-200 px-3 text-sm font-medium"
                onClick={toggleAll}
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
              <button
                type="button"
                disabled={importing || selected.size === 0}
                onClick={() => void runImportSelected()}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Import selected
              </button>
            </div>
          </div>

          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#FAFBFC] text-[11px] uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2"> </th>
                  <th className="px-3 py-2">Business</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Rating</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.placeId}
                    className="border-t border-neutral-100 hover:bg-[#FAFBFC]"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(item.placeId)}
                        onChange={() => toggleOne(item.placeId)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-neutral-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.address || item.placeId}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {[item.suburb, item.city, item.state]
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-neutral-700">
                      {item.rating.toFixed(1)} ({item.reviewCount})
                    </td>
                    <td className="px-3 py-3">
                      {item.alreadyImported ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          {item.claimed ? "Claimed" : "In catalog"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          New
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {lastResults.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            3. Import log
          </h2>
          <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-sm">
            {lastResults.map((row) => (
              <li
                key={`${row.placeId}-${row.action}`}
                className="flex justify-between gap-3 border-b border-neutral-50 py-1.5"
              >
                <span className="truncate text-neutral-800">{row.name}</span>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold uppercase",
                    row.action === "inserted" && "text-emerald-700",
                    row.action === "updated" && "text-sky-700",
                    row.action === "failed" && "text-rose-700",
                    row.action === "skipped" && "text-neutral-500",
                  )}
                >
                  {row.action}
                  {row.error ? ` — ${row.error}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good" | "info" | "bad";
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "good" && "text-emerald-700",
          tone === "info" && "text-sky-700",
          tone === "bad" && "text-rose-700",
          !tone && "text-neutral-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400";
