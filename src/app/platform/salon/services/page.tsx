import type { Metadata } from "next";

import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import {
  getServiceStaffOptions,
  getServices,
} from "@/features/salon-services/getServices";
import { ServicesManager } from "@/features/salon-services/services-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

export default async function SalonServicesPage() {
  const owner = await requireOwnerSalon("/platform/salon/services");
  const salonId = owner.salon.id;
  const supabase = await createClient();

  const [services, staffOptions] = await Promise.all([
    getServices(supabase, { salonId, includeArchived: true }),
    getServiceStaffOptions(supabase, salonId),
  ]);

  return (
    <ServicesManager
      salonId={salonId}
      initialServices={services}
      staffOptions={staffOptions}
    />
  );
}
