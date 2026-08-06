"use client";

import { cn } from "@/lib/utils";

export type BookingStepId =
  | "service"
  | "staff"
  | "date"
  | "time"
  | "customer"
  | "summary"
  | "done";

type BookingStepperProps = {
  steps: { id: BookingStepId; label: string }[];
  current: BookingStepId;
};

export function BookingStepper({ steps, current }: BookingStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === current);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {steps.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold",
            index <= currentIndex
              ? "bg-neutral-950 text-white"
              : "bg-neutral-100 text-neutral-500",
          )}
        >
          {index + 1}. {item.label}
        </div>
      ))}
    </div>
  );
}
