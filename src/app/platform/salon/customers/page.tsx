import type { Metadata } from "next";

import { MOCK_SALON_SESSION } from "@/features/dashboard/mock-data";
import { CustomersManager, getCustomers } from "@/features/customers";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export default async function SalonCustomersPage() {
  const salonId = MOCK_SALON_SESSION.salonId;
  const customers = await getCustomers({ salonId });

  return <CustomersManager salonId={salonId} initialCustomers={customers} />;
}
