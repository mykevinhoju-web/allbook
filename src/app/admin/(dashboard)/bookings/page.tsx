import { Suspense } from "react";

import { BookingScheduleContent } from "@/features/booking/components/schedule/booking-schedule-content";
import { EverAdminBookingsContent } from "@/features/ever/admin/ever-admin-bookings";
import { isEverTenant } from "@/features/ever";
import { getTenantOptional } from "@/features/tenants/server";

export default async function AdminBookingsPage() {
  const tenant = await getTenantOptional();
  if (tenant && isEverTenant(tenant.slug)) {
    return <EverAdminBookingsContent />;
  }

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
