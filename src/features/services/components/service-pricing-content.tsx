"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import {
  DEFAULT_PRICING_ADJUSTMENTS,
  type PricingAdjustments,
} from "@/features/services/lib/pricing-adjustments";
import { formatPriceFromCents } from "@/features/services/utils/format-price";

interface PricingRow {
  key: string;
  durationMinutes: string;
  price: string;
}

function emptyRow(): PricingRow {
  return {
    key: crypto.randomUUID(),
    durationMinutes: "",
    price: "",
  };
}

function dollarsInputFromCents(cents: number): string {
  if (!cents) return "";
  return String(cents / 100);
}

function centsFromDollarsInput(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

export function ServicePricingContent() {
  const [rows, setRows] = useState<PricingRow[]>([emptyRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState("AUD");
  const [nightSurcharge, setNightSurcharge] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountApplyInternal, setDiscountApplyInternal] = useState(false);
  const [discountApplyExternal, setDiscountApplyExternal] = useState(false);

  const loadOptions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchAdminApi("/api/admin/service-options");
      const data = (await response.json()) as {
        options?: {
          durationMinutes: number;
          priceCents: number;
        }[];
        currency?: string;
        pricingAdjustments?: PricingAdjustments;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 401) return;
        throw new Error(data.error ?? "Failed to load service options.");
      }

      setCurrency(data.currency ?? "AUD");

      const adjustments =
        data.pricingAdjustments ?? DEFAULT_PRICING_ADJUSTMENTS;
      setNightSurcharge(dollarsInputFromCents(adjustments.nightSurchargeCents));
      setDiscount(dollarsInputFromCents(adjustments.discountCents));
      setDiscountApplyInternal(adjustments.discountApplyInternal);
      setDiscountApplyExternal(adjustments.discountApplyExternal);

      if (data.options?.length) {
        setRows(
          data.options.map((option) => ({
            key: crypto.randomUUID(),
            durationMinutes: String(option.durationMinutes),
            price: String(option.priceCents / 100),
          })),
        );
      } else {
        setRows([
          { key: crypto.randomUUID(), durationMinutes: "20", price: "30" },
          { key: crypto.randomUUID(), durationMinutes: "30", price: "45" },
          { key: crypto.randomUUID(), durationMinutes: "45", price: "65" },
          { key: crypto.randomUUID(), durationMinutes: "60", price: "100" },
        ]);
      }
    } catch (error) {
      toast.error("Could not load pricing", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const updateRow = (key: string, field: keyof PricingRow, value: string) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };

  const save = async () => {
    const options = rows
      .filter((row) => row.durationMinutes.trim() && row.price.trim())
      .map((row) => ({
        durationMinutes: Number(row.durationMinutes),
        price: Number(row.price),
      }));

    if (options.length === 0) {
      toast.error("Add at least one duration and price.");
      return;
    }

    if (nightSurcharge.trim() && Number(nightSurcharge) < 0) {
      toast.error("Night surcharge cannot be negative.");
      return;
    }

    if (discount.trim() && Number(discount) < 0) {
      toast.error("Discount cannot be negative.");
      return;
    }

    const pricingAdjustments: PricingAdjustments = {
      nightSurchargeCents: centsFromDollarsInput(nightSurcharge),
      discountCents: centsFromDollarsInput(discount),
      discountApplyInternal,
      discountApplyExternal,
    };

    setSaving(true);

    try {
      const response = await fetchAdminApi("/api/admin/service-options", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options, pricingAdjustments }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        if (response.status === 401) return;
        throw new Error(data.error ?? "Failed to save pricing.");
      }

      toast.success("Service pricing saved");
      void loadOptions();
    } catch (error) {
      toast.error("Could not save pricing", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading pricing...</div>
    );
  }

  const nightLabel = "9:00 PM – 10:00 AM";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:gap-6 lg:p-6">
      <AdminPageHeader
        title="Services & pricing"
        description="Set duration and price for each service. Customers see these when booking."
      />

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft sm:p-6">
        <div className="mb-4 hidden gap-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_1fr_auto]">
          <span>Duration (minutes)</span>
          <span>Price ({currency})</span>
          <span className="w-10" />
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-1 gap-2 rounded-xl border border-border/40 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:gap-3 sm:border-0 sm:p-0"
            >
              <div className="space-y-1 sm:contents">
                <span className="text-xs font-medium text-muted-foreground sm:hidden">
                  Duration (min)
                </span>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 30"
                  value={row.durationMinutes}
                  onChange={(event) =>
                    updateRow(row.key, "durationMinutes", event.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1 sm:contents">
                <span className="text-xs font-medium text-muted-foreground sm:hidden">
                  Price ({currency})
                </span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 45"
                  value={row.price}
                  onChange={(event) => updateRow(row.key, "price", event.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                className="justify-self-end sm:justify-self-auto"
                aria-label="Remove row"
                onClick={() =>
                  setRows((current) =>
                    current.length > 1
                      ? current.filter((item) => item.key !== row.key)
                      : current,
                  )
                }
              >
                <Trash2 className="size-4" />
              </AppButton>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AppButton
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => setRows((current) => [...current, emptyRow()])}
          >
            <Plus className="size-4" />
            Add option
          </AppButton>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Night surcharge</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Extra amount added when a booking starts between {nightLabel}. Applies
          to every booking.
        </p>
        <div className="mt-4 max-w-xs space-y-1">
          <label
            htmlFor="night-surcharge"
            className="text-xs font-medium text-muted-foreground"
          >
            Surcharge ({currency})
          </label>
          <Input
            id="night-surcharge"
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 20"
            value={nightSurcharge}
            onChange={(event) => setNightSurcharge(event.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Discount</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Flat amount subtracted from the booking total. Choose where it applies.
        </p>
        <div className="mt-4 max-w-xs space-y-1">
          <label
            htmlFor="discount-amount"
            className="text-xs font-medium text-muted-foreground"
          >
            Discount ({currency})
          </label>
          <Input
            id="discount-amount"
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 10"
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              checked={discountApplyInternal}
              onChange={(event) => setDiscountApplyInternal(event.target.checked)}
            />
            Internal (admin / walk-in)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              checked={discountApplyExternal}
              onChange={(event) => setDiscountApplyExternal(event.target.checked)}
            />
            External (customer online)
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <AppButton
          type="button"
          className="h-11 rounded-xl"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? "Saving..." : "Save pricing"}
        </AppButton>
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Preview</p>
        <ul className="mt-2 space-y-1">
          {rows
            .filter((row) => row.durationMinutes && row.price)
            .map((row) => (
              <li key={row.key}>
                {row.durationMinutes} min —{" "}
                {formatPriceFromCents(
                  Math.round(Number(row.price) * 100),
                  currency,
                )}
              </li>
            ))}
        </ul>
        {(nightSurcharge.trim() || discount.trim()) && (
          <ul className="mt-3 space-y-1 border-t border-border/40 pt-3">
            {nightSurcharge.trim() ? (
              <li>
                Night surcharge ({nightLabel}): +
                {formatPriceFromCents(
                  centsFromDollarsInput(nightSurcharge),
                  currency,
                )}
              </li>
            ) : null}
            {discount.trim() ? (
              <li>
                Discount: −
                {formatPriceFromCents(centsFromDollarsInput(discount), currency)}
                {(discountApplyInternal || discountApplyExternal) && (
                  <span>
                    {" "}
                    (
                    {[
                      discountApplyInternal ? "internal" : null,
                      discountApplyExternal ? "external" : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    )
                  </span>
                )}
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );
}
