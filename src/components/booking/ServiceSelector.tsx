"use client";

import { cn } from "@/lib/utils";
import type { BookingCatalogService } from "@/features/salon-booking/catalog-types";

type ServiceSelectorProps = {
  services: BookingCatalogService[];
  value: string | null;
  onChange: (serviceId: string) => void;
  emptyLabel?: string;
};

export function ServiceSelector({
  services,
  value,
  onChange,
  emptyLabel = "No bookable services yet.",
}: ServiceSelectorProps) {
  if (services.length === 0) {
    return (
      <p className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {services.map((service) => {
        const active = value === service.id;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onChange(service.id)}
            className={cn(
              "rounded-[22px] border px-4 py-4 text-left transition duration-200",
              active
                ? "border-neutral-950 bg-neutral-950 text-white shadow-lg"
                : "border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold">{service.name}</p>
                <p
                  className={cn(
                    "mt-1 text-[13px]",
                    active ? "text-white/70" : "text-neutral-500",
                  )}
                >
                  {service.duration} min
                </p>
              </div>
              <p className="shrink-0 text-[15px] font-semibold tabular-nums">
                {service.priceLabel}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
