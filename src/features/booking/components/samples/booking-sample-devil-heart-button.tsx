"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import type { BookingStaffItem } from "../../config/booking-staff-mock";
import { bookingCustomerTheme as theme } from "../../lib/booking-customer-theme";
import { DevilHeartIcon } from "../devil-heart-icon";

function StaffPhoto({ staff }: { staff: BookingStaffItem }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={theme.photo}>
      {imageError || !staff.photoUrl ? (
        <div className={theme.photoFallback}>{staff.initials}</div>
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

function DevilHeartBookButton({ available }: { available: boolean }) {
  return (
    <button
      type="button"
      disabled={!available}
      className={cn(available ? theme.therapistButton : theme.mutedButton)}
    >
      {available ? (
        <>
          <DevilHeartIcon className="size-8 shrink-0" />
          <span className={theme.therapistButtonLabel}>Book Now</span>
        </>
      ) : (
        <span className="w-full text-center">Unavailable</span>
      )}
    </button>
  );
}

/** Live booking layout with devil-heart Book Now button (preview only). */
export function BookingSampleDevilHeartButton({
  staff,
}: {
  staff: BookingStaffItem[];
}) {
  return (
    <div className="space-y-3">
      <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Live layout · purple devil-heart CTA
      </p>
      {staff.map((member) => (
        <article key={member.id} className={theme.staffCard}>
          <StaffPhoto staff={member} />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div>
              <p className="text-base font-semibold text-stone-900">
                {member.name}
              </p>
              <p className={theme.role}>{member.role}</p>
            </div>
            <DevilHeartBookButton available={member.available} />
          </div>
        </article>
      ))}
    </div>
  );
}
