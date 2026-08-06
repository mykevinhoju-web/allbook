"use client";

import Image from "next/image";

import type { SalonStaffMember } from "@/types/salon";
import { cn } from "@/lib/utils";

type StaffListProps = {
  staff: SalonStaffMember[];
  selectedStaffId?: string | null;
  onSelectStaff?: (member: SalonStaffMember) => void;
};

export function StaffList({
  staff,
  selectedStaffId,
  onSelectStaff,
}: StaffListProps) {
  if (staff.length === 0) {
    return (
      <section className="rounded-3xl border border-neutral-200/80 bg-white px-6 py-12 text-center">
        <p className="text-sm text-neutral-500">No staff profiles yet.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
          Staff
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Book with a specialist you love
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {staff.map((member) => {
          const selected = member.id === selectedStaffId;
          return (
            <li
              key={member.id}
              className={cn(
                "rounded-3xl border bg-white p-4 transition duration-300",
                selected
                  ? "border-neutral-950 shadow-[0_12px_32px_rgba(17,17,17,0.08)]"
                  : "border-neutral-200/80 hover:border-neutral-300",
              )}
            >
              <div className="flex gap-3.5">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                  {member.photoUrl ? (
                    <Image
                      src={member.photoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-neutral-500">
                      {member.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold tracking-tight text-neutral-950">
                    {member.name}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {member.position}
                  </p>
                  <p className="mt-1 text-[12px] text-neutral-400">
                    {member.yearsExperience} years experience
                  </p>
                </div>
              </div>

              {member.languages.length > 0 ? (
                <p className="mt-3 text-[12px] text-neutral-500">
                  Languages: {member.languages.join(", ")}
                </p>
              ) : null}

              {member.specialties.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {member.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => onSelectStaff?.(member)}
                className={cn(
                  "mt-4 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold transition active:scale-[0.99]",
                  selected
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
                )}
              >
                {selected ? "Selected" : "Book with this staff"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
