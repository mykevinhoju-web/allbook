"use client";

import type { ReactNode } from "react";
import {
  Check,
  EyeOff,
  GitMerge,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldX,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import type {
  BusinessReviewDetail,
  ImportErrorRow,
  QueueCounts,
  ReviewQueueItem,
  ReviewQueueTab,
} from "./types";

const TABS: Array<{ id: ReviewQueueTab; label: string }> = [
  { id: "newly_imported", label: "Newly Imported" },
  { id: "updated", label: "Updated" },
  { id: "duplicates", label: "Potential Duplicates" },
  { id: "closed", label: "Closed Businesses" },
  { id: "missing", label: "Missing Google Data" },
  { id: "import_errors", label: "Import Errors" },
];

const EMPTY_COUNTS: QueueCounts = {
  newly_imported: 0,
  updated: 0,
  duplicates: 0,
  closed: 0,
  missing: 0,
  import_errors: 0,
};

export function AdminReviewQueuePanel() {
  const [tab, setTab] = useState<ReviewQueueTab>("newly_imported");
  const [counts, setCounts] = useState<QueueCounts>(EMPTY_COUNTS);
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BusinessReviewDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [duplicateTargetId, setDuplicateTargetId] = useState("");

  const loadQueue = useCallback(async (nextTab: ReviewQueueTab) => {
    setLoading(true);
    setError(null);
    try {
      const [countsRes, listRes] = await Promise.all([
        fetch("/api/platform/review/counts"),
        fetch(`/api/platform/review/queue?tab=${nextTab}`),
      ]);
      const countsData = (await countsRes.json()) as {
        error?: string;
        counts?: QueueCounts;
      };
      const listData = (await listRes.json()) as {
        error?: string;
        items?: ReviewQueueItem[];
        importErrors?: ImportErrorRow[];
      };
      if (!countsRes.ok) throw new Error(countsData.error || "Counts failed.");
      if (!listRes.ok) throw new Error(listData.error || "Queue failed.");
      setCounts(countsData.counts ?? EMPTY_COUNTS);
      setItems(listData.items ?? []);
      setImportErrors(listData.importErrors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (salonId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/platform/review/${salonId}`);
      const data = (await response.json()) as {
        error?: string;
        detail?: BusinessReviewDetail;
      };
      if (!response.ok) throw new Error(data.error || "Detail failed.");
      setDetail(data.detail ?? null);
      setSelectedId(salonId);
      setMergeTargetId("");
      setDuplicateTargetId(data.detail?.duplicates[0]?.salon.id ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load detail.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue(tab);
  }, [tab, loadQueue]);

  async function runAction(
    action: string,
    extra?: Record<string, string | undefined>,
  ) {
    if (!selectedId) return;
    setActing(true);
    setError(null);
    try {
      const response = await fetch(`/api/platform/review/${selectedId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = (await response.json()) as {
        error?: string;
        detail?: BusinessReviewDetail;
      };
      if (!response.ok) throw new Error(data.error || "Action failed.");
      if (data.detail) setDetail(data.detail);
      await loadQueue(tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setSelectedId(null);
              setDetail(null);
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              tab === t.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            )}
          >
            {t.label}
            <span className="ml-1.5 tabular-nums opacity-70">
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Queue</h2>
            {loading ? <Loader2 className="size-4 animate-spin text-slate-400" /> : null}
          </div>
          <div className="max-h-[70vh] overflow-auto">
            {tab === "import_errors" ? (
              importErrors.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No import/sync errors.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {importErrors.map((row) => (
                    <li key={row.id} className="px-4 py-3 text-sm">
                      <p className="font-medium text-slate-800">
                        {row.businessName || row.placeId || "Unknown place"}
                      </p>
                      <p className="mt-1 text-xs text-rose-600">
                        {row.error || "Failed"}
                      </p>
                      {row.salonId ? (
                        <button
                          type="button"
                          className="mt-2 text-xs font-medium text-slate-700 underline"
                          onClick={() => void loadDetail(row.salonId!)}
                        >
                          Open business
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                Nothing in this queue.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void loadDetail(item.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-slate-50",
                        selectedId === item.id && "bg-slate-50",
                      )}
                    >
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[item.suburb, item.city].filter(Boolean).join(", ")} ·{" "}
                        {item.reviewStatus}
                        {item.claimed ? " · claimed" : ""}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {!selectedId && !detailLoading ? (
            <p className="px-4 py-16 text-center text-sm text-slate-500">
              Select a business to review Google snapshot, AllBook data,
              differences, duplicates, and history.
            </p>
          ) : detailLoading || !detail ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-5 overflow-auto p-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {detail.salon.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Import {detail.salon.importedAt
                    ? new Date(detail.salon.importedAt).toLocaleString()
                    : "—"}{" "}
                  · Last sync{" "}
                  {detail.salon.googleSyncedAt
                    ? new Date(detail.salon.googleSyncedAt).toLocaleString()
                    : "—"}{" "}
                  · Claim{" "}
                  {detail.claimStatus.claimed
                    ? `yes${detail.claimStatus.owner ? ` (${detail.claimStatus.owner.fullName})` : ""}`
                    : "unclaimed"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <ActionButton
                  disabled={acting}
                  icon={<Check className="size-3.5" />}
                  label="Approve"
                  onClick={() => void runAction("approve")}
                />
                <ActionButton
                  disabled={acting}
                  icon={<XCircle className="size-3.5" />}
                  label="Reject"
                  onClick={() => void runAction("reject")}
                />
                <ActionButton
                  disabled={acting}
                  icon={<EyeOff className="size-3.5" />}
                  label="Hide"
                  onClick={() => void runAction("hide")}
                />
                <ActionButton
                  disabled={acting}
                  icon={<RotateCcw className="size-3.5" />}
                  label="Restore"
                  onClick={() => void runAction("restore")}
                />
                <ActionButton
                  disabled={acting}
                  icon={<ShieldX className="size-3.5" />}
                  label="Permanently Closed"
                  onClick={() => void runAction("permanently_closed")}
                />
                <ActionButton
                  disabled={acting}
                  icon={<RefreshCw className="size-3.5" />}
                  label="Re-sync"
                  onClick={() => void runAction("re_sync")}
                />
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  Duplicate / Merge
                </h3>
                <p className="text-xs text-slate-500">
                  Suggestions only — never merged automatically. Admin approval
                  required.
                </p>
                {detail.duplicates.length === 0 ? (
                  <p className="text-sm text-slate-500">No likely duplicates.</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.duplicates.map((dup) => (
                      <li
                        key={dup.salon.id}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-800">
                              {dup.salon.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {dup.reasons.join(", ")} · score {dup.score}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-xs font-medium text-slate-700 underline"
                            onClick={() => {
                              setDuplicateTargetId(dup.salon.id);
                              setMergeTargetId(dup.salon.id);
                            }}
                          >
                            Use
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block flex-1 text-xs">
                    <span className="mb-1 block text-slate-600">
                      Mark duplicate of (salon id)
                    </span>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs"
                      value={duplicateTargetId}
                      onChange={(e) => setDuplicateTargetId(e.target.value)}
                    />
                  </label>
                  <ActionButton
                    disabled={acting || !duplicateTargetId}
                    icon={<GitMerge className="size-3.5" />}
                    label="Mark Duplicate"
                    onClick={() =>
                      void runAction("mark_duplicate", {
                        duplicateOfSalonId: duplicateTargetId,
                      })
                    }
                  />
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block flex-1 text-xs">
                    <span className="mb-1 block text-slate-600">
                      Merge into primary (salon id)
                    </span>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs"
                      value={mergeTargetId}
                      onChange={(e) => setMergeTargetId(e.target.value)}
                    />
                  </label>
                  <ActionButton
                    disabled={acting || !mergeTargetId}
                    icon={<GitMerge className="size-3.5" />}
                    label="Merge into primary"
                    onClick={() =>
                      void runAction("merge", {
                        mergeIntoSalonId: mergeTargetId,
                      })
                    }
                  />
                </div>
              </section>

              <TwoCol
                title="Google Snapshot"
                rows={[
                  ["Place ID", detail.googleSnapshot.placeId],
                  ["Name", detail.googleSnapshot.name],
                  ["Address", detail.googleSnapshot.address],
                  ["Phone", detail.googleSnapshot.phone],
                  ["Website", detail.googleSnapshot.website],
                  [
                    "Rating",
                    `${detail.googleSnapshot.rating} (${detail.googleSnapshot.reviewCount})`,
                  ],
                  [
                    "Categories",
                    detail.googleSnapshot.categories.join(", ") || null,
                  ],
                  ["Status", detail.googleSnapshot.businessStatus],
                ]}
              />

              <TwoCol
                title="AllBook Data"
                rows={[
                  ["Description", detail.allbookData.description],
                  ["Cover", detail.allbookData.coverImage],
                  ["Logo", detail.allbookData.logo],
                  [
                    "Amenities",
                    detail.allbookData.amenities.join(", ") || null,
                  ],
                  [
                    "Service tags",
                    detail.allbookData.serviceTags.join(", ") || null,
                  ],
                  ["Primary service", detail.allbookData.primaryService],
                  [
                    "Booking",
                    detail.allbookData.bookingEnabled ? "enabled" : "disabled",
                  ],
                  [
                    "Verified",
                    detail.allbookData.verified ? "yes" : "no",
                  ],
                ]}
              />

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  Differences
                </h3>
                <div className="overflow-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-2 py-1.5">Field</th>
                        <th className="px-2 py-1.5">Google</th>
                        <th className="px-2 py-1.5">AllBook</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.differences.map((d) => (
                        <tr key={d.field} className="border-t border-slate-100">
                          <td className="px-2 py-1.5 font-medium">{d.field}</td>
                          <td className="px-2 py-1.5 text-slate-600">
                            {d.google || "—"}
                          </td>
                          <td className="px-2 py-1.5 text-slate-600">
                            {d.allbook || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  History
                </h3>
                {detail.history.length === 0 ? (
                  <p className="text-sm text-slate-500">No audit events yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.history.map((event) => (
                      <li
                        key={event.id}
                        className="rounded-lg border border-slate-100 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold capitalize text-slate-800">
                          {event.action.replaceAll("_", " ")}
                        </span>
                        <span className="text-slate-500">
                          {" "}
                          · {new Date(event.createdAt).toLocaleString()}
                          {event.actor ? ` · ${event.actor}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}

function TwoCol({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string | null | undefined]>;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
      <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd className="truncate text-slate-800">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
