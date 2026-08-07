import type { Metadata } from "next";

import { getCustomers } from "@/features/customers/getCustomers";
import { CustomersManager } from "@/features/customers/customers-manager";
import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export default async function SalonCustomersPage() {
  const owner = await requireOwnerSalon("/platform/salon/customers");
  const salonId = owner.salon.id;
  // Service role: CRM notes/tags/timeline have no owner SELECT RLS.
  const supabase = createServiceSupabase();
  const customers = await getCustomers(supabase, { salonId });

  return <CustomersManager salonId={salonId} initialCustomers={customers} />;
}
