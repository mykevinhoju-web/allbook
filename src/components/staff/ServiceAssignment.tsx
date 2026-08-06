"use client";

import { Check, X } from "lucide-react";

import type { StaffAssignedService } from "@/features/salon-staff";
import { cn } from "@/lib/utils";

type ServiceAssignmentProps = {
  options: StaffAssignedService[];
  selectedIds: string[];
  onChange: (serviceIds: string[]) => void;
  className?: string;
};

export function ServiceAssignment({
  options,
  selectedIds,
  onChange,
  className,
}: ServiceAssignmentProps) {
  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {options.map((service) => {
        const active = selectedIds.includes(service.id);
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => toggle(service.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
              active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300",
            )}
          >
            <span>
              <span className="block text-[13px] font-semibold">{service.name}</span>
              <span
                className={cn(
                  "text-[12px]",
                  active ? "text-white/65" : "text-neutral-500",
                )}
              >
                {service.category}
              </span>
            </span>
            {active ? (
              <Check className="size-4 shrink-0" />
            ) : (
              <X className="size-4 shrink-0 text-neutral-300" />
            )}
          </button>
        );
      })}
      {options.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-6 text-center text-[13px] text-neutral-500">
          Create services first, then assign them here.
        </p>
      ) : null}
    </div>
  );
}
