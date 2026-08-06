import type { Metadata } from "next";

import { MOCK_SALON_SESSION } from "@/features/dashboard/mock-data";
import {
  getServiceStaffOptions,
  getServices,
} from "@/features/salon-services";
import { ServicesManager } from "@/features/salon-services/services-manager";

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

export default async function SalonServicesPage() {
  const salonId = MOCK_SALON_SESSION.salonId;
  const [services, staffOptions] = await Promise.all([
    getServices({ salonId, includeArchived: true }),
    getServiceStaffOptions(),
  ]);

  return (
    <ServicesManager
      salonId={salonId}
      initialServices={services}
      staffOptions={staffOptions}
    />
  );
}
