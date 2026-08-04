"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import type { DemoBooking } from "../types/platform-demo-booking";
import { DevilHeartIcon } from "./devil-heart-icon";
import {
  PlatformDemoAdmin,
  PlatformDemoBookingDetail,
} from "./platform-demo-admin";
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

type DemoView = "staff" | "checkout" | "admin" | "detail";

export function PlatformDemoBooking({
  variant = "page",
}: {
  /** `phone` = embedded in desktop phone popup (in-frame navigation). */
  variant?: "page" | "phone";
}) {
  const router = useRouter();
  const isPhone = variant === "phone";

  const [view, setView] = useState<DemoView>("staff");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [pendingAdminHandoff, setPendingAdminHandoff] = useState(false);

  const detailBooking =
    bookings.find((booking) => booking.id === detailBookingId) ?? null;

  useEffect(() => {
    if (!pendingAdminHandoff) return;
    const timer = window.setTimeout(() => {
      setView("admin");
      setSelectedStaffId(null);
      setPendingAdminHandoff(false);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [pendingAdminHandoff]);

  const openStaff = (staff: BookingStaffItem) => {
    if (!staff.available) return;

    if (isPhone) {
      setSelectedStaffId(staff.id);
      setView("checkout");
      return;
    }

    const mobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;
    if (mobile) {
      setSelectedStaffId(staff.id);
      return;
    }
    router.push(`/booking/${staff.id}`);
  };

  const handleBooked = (booking: DemoBooking) => {
    setBookings((prev) => [booking, ...prev]);
    setUnreadCount((count) => count + 1);
    setShowAlert(true);
    setPendingAdminHandoff(true);
  };

  const openBookingDetail = (id: string) => {
    setDetailBookingId(id);
    setView("detail");
  };

  const resetToCustomer = () => {
    setView("staff");
    setSelectedStaffId(null);
    setDetailBookingId(null);
    setShowAlert(false);
  };

  // —— Phone / in-flow views ——
  if (isPhone && view === "checkout" && selectedStaffId) {
    return (
      <PlatformDemoCheckout
        key={selectedStaffId}
        staffId={selectedStaffId}
        embedded
        onBack={() => {
          setSelectedStaffId(null);
          setView("staff");
        }}
        onBooked={handleBooked}
      />
    );
  }

  if (isPhone && view === "admin") {
    return (
      <div className="relative min-h-full">
        <PlatformDemoAdmin
          bookings={bookings}
          unreadCount={unreadCount}
          showAlert={showAlert}
          onDismissAlert={() => setShowAlert(false)}
          onClearUnread={() => setUnreadCount(0)}
          onOpenBooking={openBookingDetail}
          onBookAnother={resetToCustomer}
        />
      </div>
    );
  }

  if (isPhone && view === "detail" && detailBooking) {
    return (
      <PlatformDemoBookingDetail
        booking={detailBooking}
        onBack={() => setView("admin")}
      />
    );
  }

  // Page-mode mobile sheet still uses selectedStaffId without switching view
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
          open={Boolean(selectedStaffId) && view !== "admin" && view !== "detail"}
          onOpenChange={(open) => {
            if (!open && !pendingAdminHandoff) {
              setSelectedStaffId(null);
            }
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="h-[min(94svh,720px)] max-h-[94svh] gap-0 overflow-hidden rounded-t-2xl p-0 sm:max-w-none"
          >
            <SheetTitle className="sr-only">Book appointment</SheetTitle>
            <div className="relative h-full overflow-y-auto overscroll-contain">
              {selectedStaffId ? (
                <PlatformDemoCheckout
                  key={selectedStaffId}
                  staffId={selectedStaffId}
                  embedded
                  onBack={() => setSelectedStaffId(null)}
                  onBooked={handleBooked}
                />
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      {!isPhone && view === "admin" ? (
        <div className="fixed inset-0 z-50 bg-[#F6F5F3] md:left-1/2 md:max-w-md md:-translate-x-1/2">
          <div className="relative h-full">
            <PlatformDemoAdmin
              bookings={bookings}
              unreadCount={unreadCount}
              showAlert={showAlert}
              onDismissAlert={() => setShowAlert(false)}
              onClearUnread={() => setUnreadCount(0)}
              onOpenBooking={openBookingDetail}
              onBookAnother={resetToCustomer}
            />
          </div>
        </div>
      ) : null}

      {!isPhone && view === "detail" && detailBooking ? (
        <div className="fixed inset-0 z-50 bg-white md:left-1/2 md:max-w-md md:-translate-x-1/2">
          <PlatformDemoBookingDetail
            booking={detailBooking}
            onBack={() => setView("admin")}
          />
        </div>
      ) : null}
    </div>
  );
}
