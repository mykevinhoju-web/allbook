"use client";

import { Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  PAYMENT_MODE_OPTIONS,
  syncCaptureModeForPaymentMode,
} from "@/features/booking-policy/defaults";
import type {
  PaymentMode,
  ServicePolicyOverride,
  ServicePolicyOverrideInput,
} from "@/features/booking-policy/types";

type Props = {
  salonId: string;
  serviceId: string;
  businessPaymentMode: PaymentMode;
};

const EMPTY: ServicePolicyOverrideInput = {
  enabled: false,
  paymentMode: null,
  depositAmountCents: null,
  depositPercent: null,
  captureMode: null,
  cancellationWindowHours: null,
  cancellationRefundPercent: null,
  depositForfeiturePercent: null,
  noShowAction: null,
  noShowFeeCents: null,
  refundMode: null,
  onlinePaymentEnabled: null,
};

export function ServicePolicyOverrideEditor({
  salonId,
  serviceId,
  businessPaymentMode,
}: Props) {
  const [form, setForm] = useState<ServicePolicyOverrideInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/platform/salon/booking-policy/service/${serviceId}?salonId=${salonId}`,
      );
      const data = (await res.json()) as {
        override?: ServicePolicyOverride | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Failed to load override.");
      if (!data.override) {
        setForm({ ...EMPTY, paymentMode: businessPaymentMode });
      } else {
        setForm({
          enabled: data.override.enabled,
          paymentMode: data.override.paymentMode,
          depositAmountCents: data.override.depositAmountCents,
          depositPercent: data.override.depositPercent,
          captureMode: data.override.captureMode,
          cancellationWindowHours: data.override.cancellationWindowHours,
          cancellationRefundPercent: data.override.cancellationRefundPercent,
          depositForfeiturePercent: data.override.depositForfeiturePercent,
          noShowAction: data.override.noShowAction,
          noShowFeeCents: data.override.noShowFeeCents,
          refundMode: data.override.refundMode,
          onlinePaymentEnabled: data.override.onlinePaymentEnabled,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [businessPaymentMode, salonId, serviceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const mode = form.paymentMode;
      const payload: ServicePolicyOverrideInput = {
        ...form,
        captureMode: mode
          ? syncCaptureModeForPaymentMode(mode)
          : form.captureMode,
      };
      const res = await fetch(
        `/api/platform/salon/booking-policy/service/${serviceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salonId, input: payload }),
        },
      );
      const data = (await res.json()) as {
        override?: ServicePolicyOverride;
        error?: string;
      };
      if (!res.ok || !data.override) {
        throw new Error(data.error || "Could not save override.");
      }
      setMessage("Service override saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="size-4 animate-spin" /> Loading override…
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
      <label className="flex items-center justify-between text-sm">
        <span>Enable override for this service</span>
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">
          Payment mode override
        </span>
        <select
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
          disabled={!form.enabled}
          value={form.paymentMode ?? ""}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              paymentMode: (e.target.value || null) as PaymentMode | null,
            }))
          }
        >
          <option value="">Inherit business ({businessPaymentMode})</option>
          {PAYMENT_MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {form.paymentMode === "fixed_deposit" ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Deposit (cents)
          </span>
          <input
            type="number"
            disabled={!form.enabled}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
            value={form.depositAmountCents ?? 0}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                depositAmountCents: Number(e.target.value),
              }))
            }
          />
        </label>
      ) : null}

      {form.paymentMode === "percentage_deposit" ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Deposit %
          </span>
          <input
            type="number"
            disabled={!form.enabled}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
            value={form.depositPercent ?? 0}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                depositPercent: Number(e.target.value),
              }))
            }
          />
        </label>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Save service override
      </button>
    </div>
  );
}
