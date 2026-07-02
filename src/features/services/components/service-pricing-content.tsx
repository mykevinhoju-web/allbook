"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
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

export function ServicePricingContent() {
  const [rows, setRows] = useState<PricingRow[]>([emptyRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState("AUD");

  const loadOptions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/service-options");
      const data = (await response.json()) as {
        options?: {
          durationMinutes: number;
          priceCents: number;
        }[];
        currency?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load service options.");
      }

      setCurrency(data.currency ?? "AUD");

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

    setSaving(true);

    try {
      const response = await fetch("/api/admin/service-options", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Services & pricing</h1>
        <p className="text-sm text-muted-foreground">
          Set duration and price for each service. Customers see these options when
          booking — the price is applied automatically.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
        <div className="mb-4 grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-muted-foreground">
          <span>Duration (minutes)</span>
          <span>Price ({currency})</span>
          <span className="w-10" />
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-[1fr_1fr_auto] items-center gap-3"
            >
              <Input
                type="number"
                min={1}
                placeholder="e.g. 30"
                value={row.durationMinutes}
                onChange={(event) =>
                  updateRow(row.key, "durationMinutes", event.target.value)
                }
                className="rounded-xl"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="e.g. 45"
                value={row.price}
                onChange={(event) => updateRow(row.key, "price", event.target.value)}
                className="rounded-xl"
              />
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
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
            className="rounded-xl"
            onClick={() => setRows((current) => [...current, emptyRow()])}
          >
            <Plus className="size-4" />
            Add option
          </AppButton>

          <AppButton
            type="button"
            className="rounded-xl"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Saving..." : "Save pricing"}
          </AppButton>
        </div>
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
      </div>
    </div>
  );
}
