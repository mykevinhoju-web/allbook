"use client";

import { Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";

import {
  CANCELLATION_PRESETS,
  CAPTURE_MODE_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  REFUND_MODE_OPTIONS,
  cancellationPresetOf,
  formatMoneyCents,
  policyToInput,
  syncCaptureModeForPaymentMode,
} from "@/features/booking-policy";
import type {
  PaymentMode,
  SalonBookingPolicy,
  SalonBookingPolicyInput,
} from "@/features/booking-policy/types";
import { cn } from "@/lib/utils";

import { ServicePolicyOverrideEditor } from "./service-policy-override-editor";

type ServiceOption = {
  id: string;
  name: string;
  category: string;
  price: number;
};

type Props = {
  salonId: string;
  initialPolicy: SalonBookingPolicy;
  services: ServiceOption[];
};

export function BookingPolicySettingsPanel({
  salonId,
  initialPolicy,
  services,
}: Props) {
  const [form, setForm] = useState<SalonBookingPolicyInput>(() =>
    policyToInput(initialPolicy),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState(
    services[0]?.id ?? "",
  );

  const cancelPreset = cancellationPresetOf(form.cancellationWindowHours);

  const previewDeposit = useMemo(() => {
    if (form.paymentMode === "fixed_deposit") {
      return formatMoneyCents(form.depositAmountCents ?? 0, form.currency);
    }
    if (form.paymentMode === "percentage_deposit") {
      return `${form.depositPercent ?? 0}%`;
    }
    if (form.paymentMode === "full_prepayment") return "100%";
    if (form.paymentMode === "card_hold") return "Card hold (no charge)";
    return "None";
  }, [form]);

  function patch(partial: Partial<SalonBookingPolicyInput>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function setPaymentMode(mode: PaymentMode) {
    patch({
      paymentMode: mode,
      captureMode: syncCaptureModeForPaymentMode(mode),
      onlinePaymentEnabled: mode !== "booking_only",
      depositAmountCents:
        mode === "fixed_deposit" ? form.depositAmountCents ?? 2000 : null,
      depositPercent:
        mode === "percentage_deposit" ? form.depositPercent ?? 30 : null,
      refundMode: mode === "booking_only" ? "none" : form.refundMode,
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/platform/salon/booking-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId, input: form }),
      });
      const data = (await res.json()) as {
        policy?: SalonBookingPolicy;
        error?: string;
      };
      if (!res.ok || !data.policy) {
        throw new Error(data.error || "Could not save policy.");
      }
      setForm(policyToInput(data.policy));
      setMessage("Booking & payment policy saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
            Settings
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
            Booking & payment policy
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Accept bookings immediately with safe defaults. Online payments and
            gateways can be enabled later — no Stripe setup required now.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save policy
        </button>
      </div>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Booking</h2>
        <Toggle
          label="Booking enabled"
          checked={form.bookingEnabled}
          onChange={(v) => patch({ bookingEnabled: v })}
        />
        <Toggle
          label="Allow walk-ins"
          checked={form.allowWalkIns}
          onChange={(v) =>
            patch({ allowWalkIns: v, appointmentOnly: v ? false : form.appointmentOnly })
          }
        />
        <Toggle
          label="Appointment only"
          checked={form.appointmentOnly}
          onChange={(v) =>
            patch({ appointmentOnly: v, allowWalkIns: v ? false : form.allowWalkIns })
          }
        />
        <Toggle
          label="Instant confirmation"
          checked={form.instantConfirmation}
          onChange={(v) =>
            patch({
              instantConfirmation: v,
              approvalRequired: v ? false : form.approvalRequired,
            })
          }
        />
        <Toggle
          label="Approval required"
          checked={form.approvalRequired}
          onChange={(v) =>
            patch({
              approvalRequired: v,
              instantConfirmation: v ? false : form.instantConfirmation,
            })
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Maximum advance booking (days)"
            value={form.maxAdvanceBookingDays}
            onChange={(v) => patch({ maxAdvanceBookingDays: v })}
          />
          <NumberField
            label="Minimum notice (hours)"
            value={form.minNoticeHours}
            onChange={(v) => patch({ minNoticeHours: v })}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">
          Payment mode
        </h2>
        <p className="text-xs text-neutral-500">
          Default: Booking only — no online payment. Deposit / prepay / card
          hold modes are ready for future Stripe Connect, Square, Tyro, PayPal,
          gift cards, loyalty, packages, and invoices.
        </p>
        <div className="space-y-2">
          {PAYMENT_MODE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border px-3 py-3",
                form.paymentMode === opt.value
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200",
              )}
            >
              <input
                type="radio"
                className="mt-1"
                checked={form.paymentMode === opt.value}
                onChange={() => setPaymentMode(opt.value)}
              />
              <span>
                <span className="block text-sm font-medium text-neutral-900">
                  {opt.label}
                </span>
                <span className="block text-xs text-neutral-500">
                  {opt.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        {form.paymentMode === "fixed_deposit" ? (
          <NumberField
            label="Fixed deposit (cents)"
            value={form.depositAmountCents ?? 0}
            onChange={(v) => patch({ depositAmountCents: v })}
            hint={`Preview: ${formatMoneyCents(form.depositAmountCents ?? 0, form.currency)}`}
          />
        ) : null}
        {form.paymentMode === "percentage_deposit" ? (
          <NumberField
            label="Deposit percent"
            value={form.depositPercent ?? 0}
            onChange={(v) => patch({ depositPercent: v })}
          />
        ) : null}

        <Toggle
          label="Online payment enabled (gateway later)"
          checked={form.onlinePaymentEnabled}
          onChange={(v) => patch({ onlinePaymentEnabled: v })}
        />
        <Toggle
          label="Remaining balance paid in salon"
          checked={form.remainingBalanceInSalon}
          onChange={(v) => patch({ remainingBalanceInSalon: v })}
        />

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Capture mode
          </span>
          <select
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.captureMode}
            onChange={(e) =>
              patch({
                captureMode: e.target.value as SalonBookingPolicyInput["captureMode"],
              })
            }
          >
            {CAPTURE_MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <p className="text-xs text-neutral-500">
          Current deposit preview: <strong>{previewDeposit}</strong>
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">
          Cancellation & no-show
        </h2>
        <div className="flex flex-wrap gap-2">
          {CANCELLATION_PRESETS.map((hours) => (
            <button
              key={hours}
              type="button"
              onClick={() => patch({ cancellationWindowHours: hours })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                cancelPreset === hours
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200",
              )}
            >
              {hours} hours
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (cancelPreset !== "custom") {
                patch({ cancellationWindowHours: 36 });
              }
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              cancelPreset === "custom"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200",
            )}
          >
            Custom
          </button>
        </div>
        {cancelPreset === "custom" ? (
          <NumberField
            label="Custom cancellation window (hours)"
            value={form.cancellationWindowHours}
            onChange={(v) => patch({ cancellationWindowHours: v })}
          />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Refund % within window"
            value={form.cancellationRefundPercent}
            onChange={(v) => patch({ cancellationRefundPercent: v })}
          />
          <NumberField
            label="Deposit forfeiture % after window"
            value={form.depositForfeiturePercent}
            onChange={(v) => patch({ depositForfeiturePercent: v })}
          />
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            No-show action
          </span>
          <select
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.noShowAction}
            onChange={(e) =>
              patch({
                noShowAction: e.target
                  .value as SalonBookingPolicyInput["noShowAction"],
              })
            }
          >
            <option value="record_only">Record only</option>
            <option value="fee">Fee</option>
            <option value="charge_hold">Charge card hold</option>
          </select>
        </label>
        {form.noShowAction === "fee" ? (
          <NumberField
            label="No-show fee (cents)"
            value={form.noShowFeeCents ?? 0}
            onChange={(v) => patch({ noShowFeeCents: v })}
          />
        ) : null}
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Refund mode
          </span>
          <select
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.refundMode}
            onChange={(e) =>
              patch({
                refundMode: e.target.value as SalonBookingPolicyInput["refundMode"],
              })
            }
          >
            {REFUND_MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">
          Service-level overrides
        </h2>
        <p className="text-xs text-neutral-500">
          Example: Women&apos;s Cut = no deposit, Hair Colour = 30% deposit,
          Extensions = full prepayment.
        </p>
        {services.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Add services first, then override policies per service.
          </p>
        ) : (
          <>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-neutral-700">
                Service
              </span>
              <select
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.category} · ${s.price}
                  </option>
                ))}
              </select>
            </label>
            {selectedServiceId ? (
              <ServicePolicyOverrideEditor
                salonId={salonId}
                serviceId={selectedServiceId}
                businessPaymentMode={form.paymentMode}
              />
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-neutral-800">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-700">{label}</span>
      <input
        type="number"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? <span className="mt-1 block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  );
}
