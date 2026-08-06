"use client";

import { useCallback, useEffect, useRef } from "react";

import { toast } from "@/components/common";
import { playServiceEndAlarm } from "@/features/booking/lib/booking-alert-sound";
import { useBookingRealtime } from "@/features/booking/lib/booking-schedule-realtime";
import { isBookingCheckedIn } from "@/features/booking/lib/booking-check-in";
import type { AdminBooking } from "@/features/booking/types/admin-booking";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import { useTenant } from "@/features/tenants";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Admin-side watcher: when a checked-in booking reaches ends_at,
 * play the service-end alarm (works even if the room tablet is slow).
 */
export function AdminServiceEndWatcher() {
  const tenant = useTenant();
  const isMobile = useIsMobile();
  const firedRef = useRef<Set<string>>(new Set());
  const bookingsRef = useRef<AdminBooking[]>([]);

  const load = useCallback(async () => {
    const from = new Date(Date.now() - 6 * 60 * 60_000).toISOString();
    const to = new Date(Date.now() + 6 * 60 * 60_000).toISOString();
    const response = await fetchAdminApi(
      `/api/admin/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    if (!response.ok) return;
    const data = (await response.json()) as { bookings?: AdminBooking[] };
    bookingsRef.current = data.bookings ?? [];
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  useBookingRealtime(tenant.id, () => {
    void load();
  });

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      for (const booking of bookingsRef.current) {
        if (!isBookingCheckedIn(booking)) continue;
        const endsMs = new Date(booking.endsAt).getTime();
        if (now < endsMs) continue;
        if (firedRef.current.has(booking.id)) continue;
        firedRef.current.add(booking.id);

        void playServiceEndAlarm(3);
        toast.error("Service time ended", {
          description: `${booking.roomName ?? "Room"} · ${booking.staffName}`,
          position: isMobile ? "top-center" : "top-right",
          duration: 10_000,
        });
      }

      // Allow re-fire if booking was extended past previous end then expires again.
      for (const id of [...firedRef.current]) {
        const booking = bookingsRef.current.find((row) => row.id === id);
        if (!booking || !isBookingCheckedIn(booking)) {
          firedRef.current.delete(id);
          continue;
        }
        if (new Date(booking.endsAt).getTime() > now) {
          firedRef.current.delete(id);
        }
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [isMobile]);

  return null;
}
