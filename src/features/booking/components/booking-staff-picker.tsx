"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import type { BookingStaffItem } from "../config/booking-staff-mock";
import { useBookStaff } from "../hooks/use-book-staff";
import { useBookingStaffList } from "../hooks/use-booking-staff-list";

function StaffPhoto({ staff }: { staff: BookingStaffItem }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-rose-50 shadow-sm ring-2 ring-rose-100 shadow-rose-100/40">
      {imageError || !staff.photoUrl ? (
        <div className="flex size-full items-center justify-center bg-rose-50 text-sm font-semibold text-rose-500">
          {staff.initials}
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={staff.photoUrl}
          alt={staff.name}
          className="size-full object-cover object-top"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

function SelectButton({ staff }: { staff: BookingStaffItem }) {
  const { bookStaff } = useBookStaff();
  const available = staff.available;

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => bookStaff(staff)}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-full border-2 px-5 text-sm font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        available
          ? "border-[#e91e63] bg-white text-[#e91e63] active:bg-white/80"
          : "border-pink-200 bg-white/60 text-pink-300",
      )}
    >
      {available ? "Select" : "Unavailable"}
    </button>
  );
}

export function BookingStaffPicker() {
  const { staff, loading, error } = useBookingStaffList();

  return (
    <div className="min-h-svh bg-[#fce4ec] text-stone-800">
      <div className="mx-auto min-h-svh max-w-md border-pink-200/60 md:border-x">
        <header className="sticky top-0 z-10 border-b border-pink-200/80 bg-[#fce4ec]/95 px-4 py-4 backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#e91e63]">
            Book appointment
          </p>
          <h1 className="mt-0.5 text-lg font-semibold tracking-tight">
            Choose your therapist
          </h1>
        </header>

        <div className="space-y-3 px-4 py-4 pb-8">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  className="flex animate-pulse items-center gap-4 rounded-2xl bg-white/40 px-3 py-3"
                >
                  <div className="size-24 shrink-0 rounded-full bg-white/70" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="h-4 w-28 rounded bg-white/70" />
                    <div className="h-3 w-20 rounded bg-white/60" />
                    <div className="h-11 w-full rounded-full bg-white/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="rounded-2xl bg-white/60 px-4 py-6 text-center text-sm text-rose-600">
              {error}
            </p>
          ) : staff.length === 0 ? (
            <p className="rounded-2xl bg-white/60 px-4 py-6 text-center text-sm text-stone-500">
              No therapists available right now.
            </p>
          ) : (
            staff.map((member) => (
              <article
                key={member.id}
                className="flex items-center gap-4 rounded-2xl bg-white/50 px-3 py-3 backdrop-blur-sm"
              >
                <StaffPhoto staff={member} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div>
                    <p className="text-base font-semibold text-stone-800">
                      {member.name}
                    </p>
                    <p className="text-xs text-[#e91e63]/70">{member.role}</p>
                  </div>
                  <SelectButton staff={member} />
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
