"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { BookingStaffItem } from "../config/booking-staff-mock";
import { useBookStaff } from "../hooks/use-book-staff";
import { useBookingStaffList } from "../hooks/use-booking-staff-list";
import { bookingCustomerTheme as theme } from "../lib/booking-customer-theme";

function StaffPhoto({ staff }: { staff: BookingStaffItem }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={theme.photo}>
      {imageError || !staff.photoUrl ? (
        <div className={theme.photoFallback}>{staff.initials}</div>
      ) : (
        <Image
          src={staff.photoUrl}
          alt={staff.name}
          fill
          sizes="112px"
          className="object-cover object-top"
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
        available ? theme.goldButton : theme.mutedButton,
      )}
    >
      {available ? "Select" : "Unavailable"}
    </button>
  );
}

export function BookingStaffPicker() {
  const { staff, loading, error } = useBookingStaffList();

  return (
    <div className={theme.page}>
      <div className={theme.shell}>
        <header className={theme.header}>
          <p className={theme.eyebrow}>Book appointment</p>
          <h1 className={theme.title}>Choose your therapist</h1>
        </header>

        <div className="space-y-3 px-4 py-4 pb-8">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className={theme.skeletonCard}>
                  <div className="size-28 shrink-0 rounded-full bg-stone-100" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="h-4 w-28 rounded bg-stone-100" />
                    <div className="h-3 w-20 rounded bg-stone-100" />
                    <div className="h-11 w-full rounded-full bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className={theme.errorState}>{error}</p>
          ) : staff.length === 0 ? (
            <p className={theme.emptyState}>
              No therapists available right now.
            </p>
          ) : (
            staff.map((member) => (
              <article key={member.id} className={theme.staffCard}>
                <StaffPhoto staff={member} />
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <div>
                    <p className="text-base font-semibold text-stone-900">
                      {member.name}
                    </p>
                    <p className={theme.role}>{member.role}</p>
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
