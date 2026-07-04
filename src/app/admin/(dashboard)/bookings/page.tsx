import { Suspense } from "react";

import { BookingScheduleContent } from "@/features/booking/components/schedule/booking-schedule-content";

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-sm text-muted-foreground">Loading bookings…</div>
      }
    >
      <BookingScheduleContent />
    </Suspense>
  );
}
