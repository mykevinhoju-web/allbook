import type { Metadata } from "next";

import { CustomersManager, getCustomers } from "@/features/customers";
import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export default async function SalonCustomersPage() {
  const owner = await requireOwnerSalon("/platform/salon/customers");
  const salonId = owner.salon.id;
  const customers = await getCustomers({ salonId });

  return <CustomersManager salonId={salonId} initialCustomers={customers} />;
}
