"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  AdminPartnerListItem,
  PartnerService,
  PartnerStatus,
} from "@/features/marketplace-partner";

/**
 * Minimal platform-admin Partner directory.
 */
export function AdminPartnersPanel() {
  const [items, setItems] = useState<AdminPartnerListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [services, setServices] = useState<PartnerService[]>([]);
  const [status, setStatus] = useState<PartnerStatus | "all">("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      const response = await fetch(`/api/platform/partners?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load.");
      setItems(data.items ?? []);
      setSelectedId((prev) => {
        if (prev && (data.items ?? []).some((i: AdminPartnerListItem) => i.id === prev)) {
          return prev;
        }
        return data.items?.[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setBusy(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setServices([]);
      return;
    }
    void (async () => {
      const response = await fetch(`/api/platform/partners/${selectedId}`);
      const data = await response.json();
      if (response.ok) setServices(data.services ?? []);
    })();
  }, [selectedId]);

  async function setPartnerStatus(next: PartnerStatus) {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/platform/partners/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed.");
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedId ? { ...item, ...data.partner } : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
            placeholder="Search name / email / phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as PartnerStatus | "all")}
          >
            <option value="all">All statuses</option>
            <option value="pending">pending</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="invited">invited</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            Refresh
          </button>
        </div>
        {error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : null}
        <ul className="divide-y divide-stone-100 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`flex w-full flex-col items-start gap-0.5 px-2 py-3 text-left ${
                  selectedId === item.id ? "bg-stone-50" : ""
                }`}
              >
                <span className="font-medium text-stone-900">
                  {item.displayName}
                </span>
                <span className="text-xs text-stone-500">
                  {item.partnerType} · {item.status} · {item.serviceCount}{" "}
                  services
                  {item.salonName ? ` · ${item.salonName}` : ""}
                </span>
              </button>
            </li>
          ))}
          {!items.length && !busy ? (
            <li className="px-2 py-6 text-stone-500">No partners yet.</li>
          ) : null}
        </ul>
      </div>

      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        {selected ? (
          <>
            <h2 className="text-lg font-medium text-stone-900">
              {selected.displayName}
            </h2>
            <dl className="grid grid-cols-2 gap-2 text-sm text-stone-700">
              <div>
                <dt className="text-xs text-stone-500">Type</dt>
                <dd>{selected.partnerType}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Status</dt>
                <dd>{selected.status}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Salon</dt>
                <dd>{selected.salonName ?? selected.salonId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Email</dt>
                <dd>{selected.email ?? "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-stone-500">Phone</dt>
                <dd>{selected.phone ?? "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-stone-500">Bio</dt>
                <dd>{selected.bio ?? "—"}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void setPartnerStatus("active")}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Activate
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void setPartnerStatus("suspended")}
                className="rounded-lg bg-amber-700 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Suspend
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void setPartnerStatus("pending")}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-50"
              >
                Mark pending
              </button>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Services</h3>
              <ul className="space-y-1 text-sm text-stone-700">
                {services.map((s) => (
                  <li key={s.id}>
                    {s.name} · {s.pricingType}
                    {s.priceCents != null
                      ? ` · $${(s.priceCents / 100).toFixed(0)}`
                      : ""}
                    {!s.isActive ? " (inactive)" : ""}
                  </li>
                ))}
                {!services.length ? <li>No services.</li> : null}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-sm text-stone-500">Select a partner.</p>
        )}
      </div>
    </div>
  );
}
