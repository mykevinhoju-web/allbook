"use client";

import { useEffect, useState } from "react";

import type { DemoBooking } from "../types/platform-demo-booking";
import {
  PlatformDemoAdmin,
  PlatformDemoBookingDetail,
} from "./platform-demo-admin";
import { PlatformDemoCheckout } from "./platform-demo-checkout";

type View = "checkout" | "admin" | "detail";

/** Full-page platform demo for `/booking/[staffId]` (desktop page flow). */
export function PlatformDemoStaffPage({ staffId }: { staffId: string }) {
  const [view, setView] = useState<View>("checkout");
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [handingOff, setHandingOff] = useState(false);

  const detail = bookings.find((b) => b.id === detailId) ?? null;

  useEffect(() => {
    if (!handingOff) return;
    const timer = window.setTimeout(() => {
      setView("admin");
      setHandingOff(false);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [handingOff]);

  if (view === "admin") {
    return (
      <div className="mx-auto min-h-svh max-w-md bg-[#F6F5F3]">
        <div className="relative min-h-svh">
          <PlatformDemoAdmin
            bookings={bookings}
            unreadCount={unreadCount}
            showAlert={showAlert}
            onDismissAlert={() => setShowAlert(false)}
            onClearUnread={() => setUnreadCount(0)}
            onOpenBooking={(id) => {
              setDetailId(id);
              setView("detail");
            }}
            onBookAnother={() => {
              window.location.href = "/booking";
            }}
          />
        </div>
      </div>
    );
  }

  if (view === "detail" && detail) {
    return (
      <div className="mx-auto min-h-svh max-w-md">
        <PlatformDemoBookingDetail
          booking={detail}
          onBack={() => setView("admin")}
        />
      </div>
    );
  }

  return (
    <PlatformDemoCheckout
      staffId={staffId}
      onBooked={(booking) => {
        setBookings((prev) => [booking, ...prev]);
        setUnreadCount((c) => c + 1);
        setShowAlert(true);
        setHandingOff(true);
      }}
    />
  );
}
