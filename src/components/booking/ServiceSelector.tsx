"use client";

import { cn } from "@/lib/utils";
import type { BookingCatalogService } from "@/features/salon-booking/mock-context";

type ServiceSelectorProps = {
  services: BookingCatalogService[];
  value: string | null;
  onChange: (serviceId: string) => void;
};

export function ServiceSelector({
  services,
  value,
  onChange,
}: ServiceSelectorProps) {
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
                    "mt-1 text-[12px]",
                    active ? "text-white/65" : "text-neutral-500",
                  )}
                >
                  {service.category} · {service.duration} min
                </p>
                {service.description ? (
                  <p
                    className={cn(
                      "mt-2 text-[13px] leading-relaxed",
                      active ? "text-white/80" : "text-neutral-600",
                    )}
                  >
                    {service.description}
                  </p>
                ) : null}
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
