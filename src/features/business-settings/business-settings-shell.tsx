"use client";

import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BookingPolicySettingsPanel } from "@/features/booking-policy";
import type { SalonBookingPolicy } from "@/features/booking-policy/types";
import { cn } from "@/lib/utils";

import {
  FEATURE_FLAG_DEFINITIONS,
  SETTINGS_GROUPS,
  definitionsForGroup,
  isSettingsGroupKey,
} from "./registry";
import type {
  FeatureFlagState,
  IntegrationSlot,
  ResolvedSettings,
  SettingsGroupKey,
} from "./types";

type ServiceOption = {
  id: string;
  name: string;
  category: string;
  price: number;
};

type Props = {
  salonId: string;
  initialGroup: SettingsGroupKey;
  policy: SalonBookingPolicy;
  services: ServiceOption[];
};

export function BusinessSettingsShell({
  salonId,
  initialGroup,
  policy,
  services,
}: Props) {
  const [group, setGroup] = useState<SettingsGroupKey>(initialGroup);
  const meta = SETTINGS_GROUPS.find((g) => g.key === group)!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          Settings Engine
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
          Business settings
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Unified configuration for every business option. Booking, payments,
          cancellation, and refunds stay in the Policy Engine — other groups
          extend here without redesign.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="space-y-1">
          {SETTINGS_GROUPS.map((g) => (
            <Link
              key={g.key}
              href={`/platform/salon/settings?group=${g.key}`}
              onClick={(e) => {
                e.preventDefault();
                setGroup(g.key);
                const url = new URL(window.location.href);
                url.searchParams.set("group", g.key);
                window.history.replaceState({}, "", url.toString());
              }}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm",
                group === g.key
                  ? "bg-neutral-900 font-medium text-white"
                  : "text-neutral-700 hover:bg-neutral-100",
              )}
            >
              {g.label}
            </Link>
          ))}
        </nav>

        <div className="min-w-0">
          {meta.policyEngine ? (
            <div className="space-y-3">
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                This group is managed by the frozen Booking &amp; Payment Policy
                Engine. Changes here update policy — not a parallel settings
                store.
              </p>
              <BookingPolicySettingsPanel
                salonId={salonId}
                initialPolicy={policy}
                services={services}
              />
            </div>
          ) : group === "features" ? (
            <FeatureFlagsPanel salonId={salonId} />
          ) : group === "integrations" ? (
            <IntegrationsPanel salonId={salonId} />
          ) : (
            <GenericSettingsGroupPanel salonId={salonId} group={group} />
          )}
        </div>
      </div>
    </div>
  );
}

function GenericSettingsGroupPanel({
  salonId,
  group,
}: {
  salonId: string;
  group: SettingsGroupKey;
}) {
  const defs = useMemo(() => definitionsForGroup(group), [group]);
  const [resolved, setResolved] = useState<ResolvedSettings | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/platform/salon/settings?group=${group}&salonId=${salonId}`,
      );
      const data = (await res.json()) as {
        settings?: ResolvedSettings;
        error?: string;
      };
      if (!res.ok || !data.settings) {
        throw new Error(data.error || "Failed to load settings.");
      }
      setResolved(data.settings);
      setDraft({ ...data.settings.values });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [group, salonId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/platform/salon/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId,
          group,
          values: draft,
        }),
      });
      const data = (await res.json()) as {
        settings?: ResolvedSettings;
        error?: string;
      };
      if (!res.ok || !data.settings) {
        throw new Error(data.error || "Save failed.");
      }
      setResolved(data.settings);
      setDraft({ ...data.settings.values });
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const meta = SETTINGS_GROUPS.find((g) => g.key === group);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-neutral-500">
        <Loader2 className="size-4 animate-spin" /> Loading {meta?.label}…
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">
            {meta?.label}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{meta?.description}</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save
        </button>
      </div>

      {message ? (
        <p className="text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {defs.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No settings registered for this group yet. Add definitions to the
          Settings Engine registry to extend it.
        </p>
      ) : (
        <div className="space-y-4">
          {defs.map((def) => {
            const from = resolved?.resolvedFrom[def.key] ?? "default";
            const value = draft[def.key];
            return (
              <div key={def.key} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-neutral-800">
                    {def.label}
                  </label>
                  <span className="text-[11px] uppercase tracking-wide text-neutral-400">
                    via {from}
                  </span>
                </div>
                {def.description ? (
                  <p className="text-xs text-neutral-500">{def.description}</p>
                ) : null}
                {def.valueType === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [def.key]: e.target.checked }))
                    }
                  />
                ) : def.valueType === "number" ? (
                  <input
                    type="number"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    value={Number(value ?? 0)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        [def.key]: Number(e.target.value),
                      }))
                    }
                  />
                ) : def.valueType === "enum" ? (
                  <select
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    value={String(value ?? "")}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [def.key]: e.target.value }))
                    }
                  >
                    {(def.enumValues ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    value={String(value ?? "")}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [def.key]: e.target.value }))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeatureFlagsPanel({ salonId }: { salonId: string }) {
  const [flags, setFlags] = useState<FeatureFlagState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/platform/salon/settings/flags?salonId=${salonId}`,
      );
      const data = (await res.json()) as {
        flags?: FeatureFlagState[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Failed to load flags.");
      setFlags(data.flags ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(key: string, enabled: boolean) {
    setSavingKey(key);
    setError(null);
    try {
      const res = await fetch("/api/platform/salon/settings/flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId, key, enabled }),
      });
      const data = (await res.json()) as {
        flag?: FeatureFlagState;
        error?: string;
      };
      if (!res.ok || !data.flag) throw new Error(data.error || "Save failed.");
      setFlags((prev) =>
        prev.map((f) => (f.key === data.flag!.key ? data.flag! : f)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-neutral-500">
        <Loader2 className="size-4 animate-spin" /> Loading feature flags…
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold text-neutral-950">Feature flags</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Enable capabilities without redesign. Payment-related flags do not
          connect gateways yet.
        </p>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <ul className="divide-y divide-neutral-100">
        {FEATURE_FLAG_DEFINITIONS.map((def) => {
          const state = flags.find((f) => f.key === def.key);
          const enabled = state?.enabled ?? def.defaultEnabled;
          return (
            <li
              key={def.key}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {def.label}
                </p>
                <p className="text-xs text-neutral-500">{def.description}</p>
              </div>
              <button
                type="button"
                disabled={savingKey === def.key}
                onClick={() => void toggle(def.key, !enabled)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  enabled
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-200 text-neutral-700",
                )}
              >
                {savingKey === def.key ? "…" : enabled ? "On" : "Off"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IntegrationsPanel({ salonId }: { salonId: string }) {
  const [slots, setSlots] = useState<IntegrationSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/platform/salon/settings/integrations?salonId=${salonId}`,
        );
        const data = (await res.json()) as { integrations?: IntegrationSlot[] };
        setSlots(data.integrations ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [salonId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-neutral-500">
        <Loader2 className="size-4 animate-spin" /> Loading integrations…
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold text-neutral-950">Integrations</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Slots reserved for Stripe, Square, Tyro, Xero, MYOB, calendars, and
          social — disconnected until connected later. No gateway code here.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {slots.map((slot) => (
          <li
            key={slot.provider}
            className="rounded-xl border border-neutral-200 px-3 py-3 text-sm"
          >
            <p className="font-medium capitalize text-neutral-900">
              {slot.provider.replaceAll("_", " ")}
            </p>
            <p className="mt-1 text-xs capitalize text-neutral-500">
              {slot.status}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function parseSettingsGroupParam(
  value: string | null | undefined,
): SettingsGroupKey {
  if (value && isSettingsGroupKey(value)) return value;
  return "business";
}
