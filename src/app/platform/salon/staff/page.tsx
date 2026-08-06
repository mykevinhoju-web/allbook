import type { Metadata } from "next";

import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import {
  getAssignableServices,
  getStaff,
} from "@/features/salon-staff";
import { StaffManager } from "@/features/salon-staff/staff-manager";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default async function SalonStaffPage() {
  const owner = await requireOwnerSalon("/platform/salon/staff");
  const salonId = owner.salon.id;
  const [staff, serviceOptions] = await Promise.all([
    getStaff({ salonId, includeArchived: true }),
    Promise.resolve(getAssignableServices()),
  ]);

  return (
    <StaffManager
      salonId={salonId}
      initialStaff={staff}
      serviceOptions={serviceOptions}
    />
  );
}
