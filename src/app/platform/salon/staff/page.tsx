import type { Metadata } from "next";

import { MOCK_SALON_SESSION } from "@/features/dashboard/mock-data";
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
  const salonId = MOCK_SALON_SESSION.salonId;
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
