"use client";

import {
  SERVICE_PRICE_TYPE_LABELS,
  type ServicePriceType,
} from "@/features/salon-services";
import { cn } from "@/lib/utils";

type PriceInputProps = {
  priceType: ServicePriceType;
  price: number;
  priceMax: number | null;
  onPriceTypeChange: (type: ServicePriceType) => void;
  onPriceChange: (price: number) => void;
  onPriceMaxChange: (priceMax: number | null) => void;
  className?: string;
};

const fieldClass =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-[14px] outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5";

export function PriceInput({
  priceType,
  price,
  priceMax,
  onPriceTypeChange,
  onPriceChange,
  onPriceMaxChange,
  className,
}: PriceInputProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(SERVICE_PRICE_TYPE_LABELS) as ServicePriceType[]).map(
          (type) => {
            const active = priceType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onPriceTypeChange(type)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-[12px] font-semibold transition sm:text-[13px]",
                  active
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                )}
              >
                {SERVICE_PRICE_TYPE_LABELS[type]}
              </button>
            );
          },
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            {priceType === "from"
              ? "From price *"
              : priceType === "range"
                ? "Min price *"
                : "Price *"}
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-neutral-400">
              $
            </span>
            <input
              type="number"
              min={0}
              step={1}
              className={cn(fieldClass, "pl-7")}
              value={Number.isFinite(price) ? price : 0}
              onChange={(e) => onPriceChange(Number(e.target.value))}
            />
          </div>
        </label>

        {priceType === "range" ? (
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">
              Max price *
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-neutral-400">
                $
              </span>
              <input
                type="number"
                min={0}
                step={1}
                className={cn(fieldClass, "pl-7")}
                value={priceMax ?? ""}
                onChange={(e) =>
                  onPriceMaxChange(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </div>
          </label>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>
    </div>
  );
}
