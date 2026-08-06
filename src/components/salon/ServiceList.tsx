"use client";

import { Clock } from "lucide-react";

import type { SalonServiceGroup, SalonServiceItem } from "@/types/salon";
import { cn } from "@/lib/utils";

type ServiceListProps = {
  groups: SalonServiceGroup[];
  selectedServiceId?: string | null;
  onSelectService?: (service: SalonServiceItem) => void;
};

export function ServiceList({
  groups,
  selectedServiceId,
  onSelectService,
}: ServiceListProps) {
  if (groups.length === 0) {
    return (
      <section className="rounded-3xl border border-neutral-200/80 bg-white px-6 py-12 text-center">
        <p className="text-sm text-neutral-500">No services listed yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
          Services
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Choose a service to start booking
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.category} className="space-y-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            {group.category}
          </h3>
          <ul className="space-y-2.5">
            {group.services.map((service) => {
              const selected = service.id === selectedServiceId;
              return (
                <li
                  key={service.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border bg-white p-4 transition duration-300 sm:flex-row sm:items-center sm:justify-between",
                    selected
                      ? "border-neutral-950 shadow-[0_10px_30px_rgba(17,17,17,0.08)]"
                      : "border-neutral-200/80 hover:border-neutral-300",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight text-neutral-950">
                      {service.name}
                    </p>
                    {service.description ? (
                      <p className="mt-1 text-sm text-neutral-500">
                        {service.description}
                      </p>
                    ) : null}
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-neutral-500">
                      <Clock className="size-3.5" />
                      {service.durationMinutes} min
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p className="text-base font-semibold tabular-nums text-neutral-950">
                      ${service.price}
                    </p>
                    <button
                      type="button"
                      onClick={() => onSelectService?.(service)}
                      className={cn(
                        "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]",
                        selected
                          ? "bg-neutral-950 text-white"
                          : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
                      )}
                    >
                      {selected ? "Selected" : "Book"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
