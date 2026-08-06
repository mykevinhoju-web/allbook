"use client";

import {
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from "@/features/salon-services";
import { cn } from "@/lib/utils";

type CategoryFilterProps = {
  value: ServiceCategory | "all";
  onChange: (value: ServiceCategory | "all") => void;
  counts?: Partial<Record<ServiceCategory | "all", number>>;
  className?: string;
};

export function CategoryFilter({
  value,
  onChange,
  counts,
  className,
}: CategoryFilterProps) {
  const items: Array<ServiceCategory | "all"> = ["all", ...SERVICE_CATEGORIES];

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const active = value === item;
        const label = item === "all" ? "All" : item;
        const count = counts?.[item];
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition duration-200",
              active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
            )}
          >
            {label}
            {typeof count === "number" ? (
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  active ? "text-white/70" : "text-neutral-400",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
