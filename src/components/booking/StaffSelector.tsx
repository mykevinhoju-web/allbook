"use client";

import { cn } from "@/lib/utils";
import type { BookingCatalogStaff } from "@/features/salon-booking/mock-context";

type StaffSelectorProps = {
  staff: BookingCatalogStaff[];
  value: string | null;
  onChange: (staffId: string) => void;
};

export function StaffSelector({ staff, value, onChange }: StaffSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {staff.map((member) => {
        const active = value === member.id;
        const initials = member.displayName
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("");
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onChange(member.id)}
            disabled={!member.bookingEnabled}
            className={cn(
              "flex items-center gap-3 rounded-[22px] border px-4 py-4 text-left transition",
              active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white hover:border-neutral-300",
              !member.bookingEnabled && "cursor-not-allowed opacity-45",
            )}
          >
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photo}
                alt=""
                className="size-12 rounded-2xl object-cover"
              />
            ) : (
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl text-[12px] font-semibold",
                  active
                    ? "bg-white/15 text-white"
                    : "bg-neutral-950 text-white",
                )}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">
                {member.displayName}
              </p>
              <p
                className={cn(
                  "text-[12px]",
                  active ? "text-white/65" : "text-neutral-500",
                )}
              >
                {member.role}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
