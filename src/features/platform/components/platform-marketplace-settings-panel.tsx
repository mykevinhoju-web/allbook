"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DEFAULT_OWNER_KEYWORD_LIMIT,
  MAX_OWNER_KEYWORD_LIMIT,
} from "@/features/business";

/**
 * Super-admin marketplace settings (keyword caps, …).
 */
export function PlatformMarketplaceSettingsPanel() {
  const [limit, setLimit] = useState(DEFAULT_OWNER_KEYWORD_LIMIT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/platform/settings/marketplace");
        const data = (await res.json()) as {
          ownerKeywordLimit?: number;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Failed to load settings.");
        if (!cancelled) {
          setLimit(data.ownerKeywordLimit ?? DEFAULT_OWNER_KEYWORD_LIMIT);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/platform/settings/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerKeywordLimit: limit }),
      });
      const data = (await res.json()) as {
        ownerKeywordLimit?: number;
        error?: string;
      };
      if (!res.ok || data.ownerKeywordLimit == null) {
        throw new Error(data.error || "Could not save.");
      }
      setLimit(data.ownerKeywordLimit);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          Platform
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Marketplace defaults for salon owners.
        </p>
      </div>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
          Owner search keywords
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          How many keywords each salon owner can set on their business profile.
          Default is 5 — raise this when you want to allow more.
        </p>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-[12px] font-medium text-neutral-500">
            Max keywords per salon
          </span>
          <input
            type="number"
            min={1}
            max={MAX_OWNER_KEYWORD_LIMIT}
            disabled={loading || saving}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 1)}
            className="h-11 w-full max-w-[180px] rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400 disabled:bg-neutral-50"
          />
        </label>
        <p className="mt-2 text-[12px] text-neutral-500">
          Allowed range: 1–{MAX_OWNER_KEYWORD_LIMIT}
        </p>

        <div className="mt-5">
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void save()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save
          </button>
        </div>
      </section>
    </div>
  );
}
