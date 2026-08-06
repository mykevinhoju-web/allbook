import type { Metadata } from "next";

import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import {
  getAssignableServices,
  getStaff,
} from "@/features/salon-staff/getStaff";
import { StaffManager } from "@/features/salon-staff/staff-manager";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default async function SalonStaffPage() {
  const owner = await requireOwnerSalon("/platform/salon/staff");
  const salonId = owner.salon.id;
  // Service role: salon_staff_leaves has no owner SELECT RLS.
  const supabase = createServiceSupabase();

  const [staff, serviceOptions] = await Promise.all([
    getStaff(supabase, { salonId, includeArchived: true }),
    getAssignableServices(supabase, salonId),
  ]);

  return (
    <StaffManager
      salonId={salonId}
      initialStaff={staff}
      serviceOptions={serviceOptions}
    />
  );
}
