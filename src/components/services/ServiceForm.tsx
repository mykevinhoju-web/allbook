"use client";

import { useState } from "react";

import {
  SERVICE_CATEGORIES,
  validateServiceInput,
  type SalonService,
  type ServiceInput,
  type ServiceStaffMember,
} from "@/features/salon-services";
import { cn } from "@/lib/utils";

import { DurationSelector } from "./DurationSelector";
import { PriceInput } from "./PriceInput";

const fieldClass =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-[14px] outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5";

type ServiceFormProps = {
  initial?: SalonService | null;
  staffOptions: ServiceStaffMember[];
  submitLabel?: string;
  onSubmit: (input: ServiceInput) => Promise<void> | void;
  onCancel: () => void;
};

function toInput(service?: SalonService | null): ServiceInput {
  if (!service) {
    return {
      name: "",
      category: "Hair Cut",
      description: "",
      duration: 60,
      price: 0,
      priceMax: null,
      priceType: "fixed",
      staffIds: [],
      status: "active",
      featured: false,
      bookingEnabled: true,
    };
  }

  return {
    name: service.name,
    category: service.category,
    description: service.description,
    duration: service.duration,
    price: service.price,
    priceMax: service.priceMax,
    priceType: service.priceType,
    staffIds: service.staffIds,
    displayOrder: service.displayOrder,
    status: service.status === "archived" ? "inactive" : service.status,
    featured: service.featured,
    bookingEnabled: service.bookingEnabled,
  };
}

export function ServiceForm({
  initial,
  staffOptions,
  submitLabel = "Save service",
  onSubmit,
  onCancel,
}: ServiceFormProps) {
  const [form, setForm] = useState<ServiceInput>(() => toInput(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function patch(partial: Partial<ServiceInput>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function toggleStaff(id: string) {
    setForm((prev) => ({
      ...prev,
      staffIds: prev.staffIds.includes(id)
        ? prev.staffIds.filter((s) => s !== id)
        : [...prev.staffIds, id],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = validateServiceInput(form);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Service name *
          </span>
          <input
            className={fieldClass}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="e.g. Women's Cut"
            autoFocus
          />
        </label>

        <label>
          <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Category *
          </span>
          <select
            className={fieldClass}
            value={form.category}
            onChange={(e) =>
              patch({ category: e.target.value as ServiceInput["category"] })
            }
          >
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Display order
          </span>
          <input
            type="number"
            min={0}
            className={fieldClass}
            value={form.displayOrder ?? 0}
            onChange={(e) => patch({ displayOrder: Number(e.target.value) })}
          />
        </label>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[13px] font-medium text-neutral-700">
            Duration *
          </p>
          <DurationSelector
            value={form.duration}
            onChange={(duration) => patch({ duration })}
          />
          <p className="mt-2 text-[12px] text-neutral-500">
            Used by the booking engine to calculate available time slots.
          </p>
        </div>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[13px] font-medium text-neutral-700">
            Pricing *
          </p>
          <PriceInput
            priceType={form.priceType}
            price={form.price}
            priceMax={form.priceMax ?? null}
            onPriceTypeChange={(priceType) => patch({ priceType })}
            onPriceChange={(price) => patch({ price })}
            onPriceMaxChange={(priceMax) => patch({ priceMax })}
          />
        </div>

        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Description
          </span>
          <textarea
            rows={3}
            className={cn(fieldClass, "h-auto py-2.5")}
            value={form.description ?? ""}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="What guests should expect…"
          />
        </label>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[13px] font-medium text-neutral-700">
            Available staff
          </p>
          <div className="flex flex-wrap gap-2">
            {staffOptions.map((member) => {
              const active = form.staffIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleStaff(member.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition",
                    active
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                  )}
                >
                  {member.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-[#FAFBFC] p-4 sm:grid-cols-3">
        <ToggleRow
          label="Active"
          description="Visible in menu"
          checked={form.status !== "inactive"}
          onChange={(checked) =>
            patch({ status: checked ? "active" : "inactive" })
          }
        />
        <ToggleRow
          label="Featured"
          description="Highlight on page"
          checked={Boolean(form.featured)}
          onChange={(featured) => patch({ featured })}
        />
        <ToggleRow
          label="Online booking"
          description="Bookable online"
          checked={Boolean(form.bookingEnabled)}
          onChange={(bookingEnabled) => patch({ bookingEnabled })}
        />
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-50"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-[13px] font-semibold text-neutral-900">
          {label}
        </span>
        <span className="text-[12px] text-neutral-500">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 size-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
