import type { Metadata } from "next";

import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
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
  const owner = await requireOwnerSalon("/platform/salon/services");
  const salonId = owner.salon.id;
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
