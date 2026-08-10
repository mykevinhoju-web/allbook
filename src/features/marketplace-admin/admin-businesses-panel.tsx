"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CalendarOff,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  DEFAULT_OWNER_KEYWORD_LIMIT,
  MAX_OWNER_KEYWORD_LIMIT,
} from "@/features/business";
import { buildSalonPathFromService } from "@/features/category";
import { cn } from "@/lib/utils";

import type {
  BusinessManageStatus,
  ListBusinessesResult,
  ManagedBusiness,
} from "./types";

type BookingFilter = "all" | "on" | "off";
type VisibleFilter = "all" | "yes" | "no";
type OwnershipFilter = "all" | "pending" | "verified" | "unclaimed";

/**
 * Platform-admin directory: browse all marketplace businesses and toggle
 * online booking / marketplace visibility.
 */
export function AdminBusinessesPanel() {
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [reviewStatus, setReviewStatus] = useState<
    BusinessManageStatus | "all"
  >("all");
  const [booking, setBooking] = useState<BookingFilter>("all");
  const [visible, setVisible] = useState<VisibleFilter>("all");
  const [ownership, setOwnership] = useState<OwnershipFilter>("all");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ListBusinessesResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywordDraft, setKeywordDraft] = useState(String(DEFAULT_OWNER_KEYWORD_LIMIT));
  const [priorityDraft, setPriorityDraft] = useState("0");

  const selected =
    result?.items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) {
      setKeywordDraft(String(selected.ownerKeywordLimit));
      setPriorityDraft(String(selected.searchPriority ?? 0));
    }
  }, [selected?.id, selected?.ownerKeywordLimit, selected?.searchPriority]);

  // Live search: typing updates the query after a short pause (Enter/Search still works).
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draftQ.trim();
      setPage(1);
      setQ((prev) => (prev === next ? prev : next));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [draftQ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (reviewStatus !== "all") params.set("reviewStatus", reviewStatus);
      if (booking !== "all") params.set("booking", booking);
      if (visible !== "all") params.set("visible", visible);
      if (ownership !== "all") params.set("ownership", ownership);
      params.set("page", String(page));
      params.set("pageSize", "40");

      const response = await fetch(`/api/platform/businesses?${params}`);
      const data = (await response.json()) as ListBusinessesResult & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Failed to load.");
      setResult(data);
      setSelectedId((prev) => {
        if (prev && data.items.some((i) => i.id === prev)) return prev;
        return data.items[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [q, reviewStatus, booking, visible, ownership, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(
    salonId: string,
    body: {
      bookingEnabled?: boolean;
      marketplaceVisible?: boolean;
      reviewStatus?: BusinessManageStatus;
      verified?: boolean;
      ownerKeywordLimit?: number;
      searchPriority?: number;
      ownershipStatus?:
        | "unclaimed"
        | "pending_verification"
        | "verified"
        | "rejected";
    },
  ) {
    setActing(true);
    setError(null);
    try {
      const response = await fetch(`/api/platform/businesses/${salonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        error?: string;
        business?: ManagedBusiness;
      };
      if (!response.ok) throw new Error(data.error || "Update failed.");
      if (data.business) {
        setResult((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((item) =>
                  item.id === salonId ? data.business! : item,
                ),
              }
            : prev,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setActing(false);
    }
  }

  const publicHref = selected
    ? buildSalonPathFromService(selected.primaryService, selected.slug)
    : null;

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(draftQ.trim());
        }}
      >
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="Search business name, suburb, phone…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </label>
        <select
          value={reviewStatus}
          onChange={(e) => {
            setPage(1);
            setReviewStatus(e.target.value as BusinessManageStatus | "all");
          }}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="hidden">Hidden</option>
          <option value="duplicate">Duplicate</option>
        </select>
        <select
          value={booking}
          onChange={(e) => {
            setPage(1);
            setBooking(e.target.value as BookingFilter);
          }}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
        >
          <option value="all">Booking: all</option>
          <option value="on">Booking ON</option>
          <option value="off">Booking OFF</option>
        </select>
        <select
          value={visible}
          onChange={(e) => {
            setPage(1);
            setVisible(e.target.value as VisibleFilter);
          }}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
        >
          <option value="all">Visibility: all</option>
          <option value="yes">Visible</option>
          <option value="no">Hidden</option>
        </select>
        <select
          value={ownership}
          onChange={(e) => {
            setPage(1);
            setOwnership(e.target.value as OwnershipFilter);
          }}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
        >
          <option value="all">Ownership: all</option>
          <option value="pending">Pending verification</option>
          <option value="verified">Verified</option>
          <option value="unclaimed">Unclaimed</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Businesses
              {result ? (
                <span className="ml-2 font-normal text-slate-500">
                  {result.total.toLocaleString()}
                </span>
              ) : null}
            </p>
            {loading ? (
              <Loader2 className="size-4 animate-spin text-slate-400" />
            ) : null}
          </div>

          {loading && !result ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </div>
          ) : !result || result.items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No businesses match these filters.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {result.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-slate-50",
                      selectedId === item.id && "bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {item.name}
                          {(item.searchPriority ?? 0) > 0 ? (
                            <span className="ml-2 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                              P{item.searchPriority}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {[item.suburb, item.city].filter(Boolean).join(", ")}{" "}
                          · {item.primaryService || "—"} · {item.reviewStatus}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Flag
                          on={item.bookingEnabled}
                          onLabel="Book ON"
                          offLabel="Book OFF"
                        />
                        <Flag
                          on={item.marketplaceVisible}
                          onLabel="Visible"
                          offLabel="Hidden"
                        />
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {result && result.total > result.pageSize ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-xs text-slate-500">
                Page {result.page} · {result.pageSize}/page
              </p>
              <button
                type="button"
                disabled={!result.hasMore || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {!selected ? (
            <p className="px-4 py-16 text-center text-sm text-slate-500">
              Select a business to manage booking and visibility.
            </p>
          ) : (
            <div className="space-y-5 p-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selected.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {[selected.suburb, selected.city, selected.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.primaryService || "No category"} ·{" "}
                  {selected.source} · {selected.reviewStatus}
                  {selected.claimed ? " · claimed" : " · unclaimed"}
                  {selected.verified ? " · verified" : ""}
                  {" · ownership: "}
                  {selected.ownershipStatus}
                </p>
              </div>

              {selected.ownershipStatus === "pending_verification" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-950">
                    Ownership pending verification
                  </p>
                  <p className="mt-1 text-xs text-amber-900/80">
                    Approve only if you are confident this applicant owns the
                    business. Booking stays off until you enable it separately.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton
                      disabled={acting}
                      primary
                      label="Approve ownership"
                      onClick={() =>
                        void patch(selected.id, {
                          ownershipStatus: "verified",
                        })
                      }
                    />
                    <ActionButton
                      disabled={acting}
                      label="Reject claim"
                      onClick={() =>
                        void patch(selected.id, {
                          ownershipStatus: "rejected",
                        })
                      }
                    />
                  </div>
                </div>
              ) : null}

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Rating" value={selected.rating.toFixed(1)} />
                <Stat
                  label="Reviews"
                  value={String(selected.reviewCount)}
                />
                <Stat
                  label="Phone"
                  value={selected.phone || "—"}
                />
                <Stat label="Slug" value={selected.slug} />
              </dl>

              <div className="flex flex-wrap gap-2">
                <ActionButton
                  disabled={acting}
                  icon={
                    selected.bookingEnabled ? (
                      <CalendarOff className="size-3.5" />
                    ) : (
                      <CalendarCheck className="size-3.5" />
                    )
                  }
                  label={
                    selected.bookingEnabled
                      ? "Disable online booking"
                      : "Enable online booking"
                  }
                  onClick={() =>
                    void patch(selected.id, {
                      bookingEnabled: !selected.bookingEnabled,
                    })
                  }
                  primary={!selected.bookingEnabled}
                />
                <ActionButton
                  disabled={acting}
                  icon={
                    selected.marketplaceVisible ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )
                  }
                  label={
                    selected.marketplaceVisible
                      ? "Hide from marketplace"
                      : "Show on marketplace"
                  }
                  onClick={() =>
                    void patch(selected.id, {
                      marketplaceVisible: !selected.marketplaceVisible,
                    })
                  }
                />
                {selected.reviewStatus !== "approved" ? (
                  <ActionButton
                    disabled={acting}
                    label="Approve"
                    onClick={() =>
                      void patch(selected.id, {
                        reviewStatus: "approved",
                        marketplaceVisible: true,
                        verified: true,
                      })
                    }
                  />
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Search keywords (paid upgrade)
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Free default is {DEFAULT_OWNER_KEYWORD_LIMIT}. Raise this only
                  for salons that paid for extra keyword slots — not for every
                  business.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Keyword limit
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_OWNER_KEYWORD_LIMIT}
                      disabled={acting}
                      value={keywordDraft}
                      onChange={(e) => setKeywordDraft(e.target.value)}
                      className="h-9 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 disabled:opacity-50"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      const next = Number(keywordDraft);
                      if (!Number.isFinite(next)) return;
                      void patch(selected.id, { ownerKeywordLimit: next });
                    }}
                    className="inline-flex h-9 items-center rounded-full border border-slate-950 bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Save limit
                  </button>
                  {selected.ownerKeywordLimit > DEFAULT_OWNER_KEYWORD_LIMIT ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                      Paid slots · {selected.ownerKeywordLimit}
                    </span>
                  ) : (
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      Default · {DEFAULT_OWNER_KEYWORD_LIMIT}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Search list priority
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Higher numbers appear earlier in the left search list (before
                  distance / rating). Default is 0. Example: 100 pins near the
                  top within the search radius.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Priority
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      disabled={acting}
                      value={priorityDraft}
                      onChange={(e) => setPriorityDraft(e.target.value)}
                      className="h-9 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 disabled:opacity-50"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      const next = Number(priorityDraft);
                      if (!Number.isFinite(next)) return;
                      void patch(selected.id, { searchPriority: next });
                    }}
                    className="inline-flex h-9 items-center rounded-full border border-slate-950 bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Save priority
                  </button>
                  {(selected.searchPriority ?? 0) > 0 ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                      Boosted · {selected.searchPriority}
                    </span>
                  ) : (
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      Default · 0
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-sm">
                {publicHref ? (
                  <Link
                    href={publicHref}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Public page <ExternalLink className="size-3.5" />
                  </Link>
                ) : null}
                <Link
                  href="/platform/review"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Open review queue
                </Link>
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                Enabling online booking turns on the public Book Now flow for
                this business. Import starts with booking OFF until you enable
                it here. Services and staff still need to exist for slots to
                appear.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Flag({
  on,
  onLabel,
  offLabel,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        on
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      )}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  icon,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition disabled:opacity-50",
        primary
          ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
