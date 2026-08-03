"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import {
  bookingStaffMock,
  type BookingStaffItem,
} from "../config/booking-staff-mock";
import { bookingCustomerTheme as theme } from "../lib/booking-customer-theme";
import { DevilHeartIcon } from "./devil-heart-icon";
import { PlatformDemoCheckout } from "./platform-demo-checkout";

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
          unoptimized
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

export function PlatformDemoBooking({
  variant = "page",
}: {
  /** `phone` = embedded in desktop phone popup (in-frame navigation). */
  variant?: "page" | "phone";
}) {
  const router = useRouter();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const isPhone = variant === "phone";

  const openStaff = (staff: BookingStaffItem) => {
    if (!staff.available) return;

    if (isPhone) {
      setSelectedStaffId(staff.id);
      return;
    }

    // Page mode: mobile uses sheet; desktop navigates.
    const mobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;
    if (mobile) {
      setSelectedStaffId(staff.id);
      return;
    }
    router.push(`/booking/${staff.id}`);
  };

  if (isPhone && selectedStaffId) {
    return (
      <PlatformDemoCheckout
        key={selectedStaffId}
        staffId={selectedStaffId}
        embedded
        onBack={() => setSelectedStaffId(null)}
      />
    );
  }

  const sheetOpen = !isPhone && Boolean(selectedStaffId);

  return (
    <div className={isPhone ? "bg-white text-stone-900" : theme.page}>
      <div className={isPhone ? undefined : theme.shell}>
        {isPhone ? null : (
          <div className="border-b border-stone-100 bg-stone-50 px-4 py-2.5 text-center text-[11px] text-stone-500">
            AllBook demo ·{" "}
            <Link
              href="/"
              className="font-medium text-stone-700 underline-offset-2 hover:underline"
            >
              Back to home
            </Link>
          </div>
        )}

        <header className={cn(theme.header, isPhone && "py-4")}>
          <p className={theme.eyebrow}>Book appointment</p>
          <h1
            className={cn(
              isPhone
                ? "mt-1 text-[1.35rem] font-bold leading-snug tracking-tight text-stone-900"
                : theme.title,
            )}
          >
            Choose your therapist
          </h1>
        </header>

        <div className={cn(theme.staffList, "relative z-0")}>
          {bookingStaffMock.map((member) => (
            <article
              key={member.id}
              className={cn(theme.staffCard, "relative z-0 overflow-hidden")}
            >
              <StaffPhoto staff={member} />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div>
                  <p className={theme.staffName}>{member.name}</p>
                  <p className={theme.role}>{member.role}</p>
                </div>
                <button
                  type="button"
                  disabled={!member.available}
                  onClick={() => openStaff(member)}
                  className={cn(
                    member.available ? theme.therapistButton : theme.mutedButton,
                    "max-w-full",
                  )}
                >
                  {member.available ? (
                    <>
                      <DevilHeartIcon className="size-7 shrink-0 sm:size-8" />
                      <span className={theme.therapistButtonLabel}>Book Now</span>
                    </>
                  ) : (
                    "Unavailable"
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {!isPhone ? (
        <Sheet
          open={sheetOpen}
          onOpenChange={(open) => {
            if (!open) setSelectedStaffId(null);
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="h-[min(94svh,720px)] max-h-[94svh] gap-0 overflow-hidden rounded-t-2xl p-0 sm:max-w-none"
          >
            <SheetTitle className="sr-only">Book appointment</SheetTitle>
            <div className="h-full overflow-y-auto overscroll-contain">
              {selectedStaffId ? (
                <PlatformDemoCheckout
                  key={selectedStaffId}
                  staffId={selectedStaffId}
                  embedded
                  onBack={() => setSelectedStaffId(null)}
                />
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
