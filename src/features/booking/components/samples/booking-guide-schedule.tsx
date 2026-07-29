"use client";

import { StaffGuideTimeline } from "@/features/booking/components/schedule/staff-guide-timeline";
import { useTenant } from "@/features/tenants";
import { useEffect, useState } from "react";
import Link from "next/link";

import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import type { StaffRecord } from "@/features/staff/types";
import type { AdminBooking } from "@/features/booking/types/admin-booking";
import { useBookingRealtime } from "@/features/booking/lib/booking-schedule-realtime";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import { filterActiveRoomBookings } from "@/features/booking/lib/room-occupancy";
import { useNowTick } from "@/hooks/use-now-tick";

/**
 * Sample preview of the production 6-hour block schedule.
 * Live bookings: /admin/bookings
 */
export function BookingGuideScheduleSample() {
  const tenant = useTenant();
  const timeZone = tenant.settings.timezone || "Australia/Sydney";
  const now = useNowTick(60_000);
  const [date, setDate] = useState(() => todayDateInZone(timeZone));
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [staffRes, bookingRes] = await Promise.all([
          fetchAdminApi("/api/admin/staff"),
          fetchAdminApi(`/api/admin/bookings?date=${encodeURIComponent(date)}`),
        ]);
        if (cancelled) return;
        if (staffRes.ok) {
          const data = (await staffRes.json()) as { staff?: StaffRecord[] };
          setStaff(data.staff ?? []);
        }
        if (bookingRes.ok) {
          const data = (await bookingRes.json()) as {
            bookings?: AdminBooking[];
          };
          setBookings(data.bookings ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  useBookingRealtime(tenant.id, () => {
    void (async () => {
      const bookingRes = await fetchAdminApi(
        `/api/admin/bookings?date=${encodeURIComponent(date)}`,
      );
      if (!bookingRes.ok) return;
      const data = (await bookingRes.json()) as { bookings?: AdminBooking[] };
      setBookings(data.bookings ?? []);
    })();
  });

  const visible = filterActiveRoomBookings(bookings, now);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 px-3 py-2 text-sm md:px-6">
        <Link
          href="/admin/bookings"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          ← Open live bookings
        </Link>
        <span className="text-muted-foreground">
          {" "}
          · this page is the sample preview
        </span>
      </div>
      <StaffGuideTimeline
        date={date}
        onDateChange={setDate}
        timeZone={timeZone}
        staff={staff}
        bookings={visible}
        loading={loading}
        selectedBookingId={selectedId}
        onBookingSelect={(booking) => setSelectedId(booking.id)}
      />
    </div>
  );
}
