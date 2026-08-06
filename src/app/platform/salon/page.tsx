import { SalonDashboardHome } from "@/features/dashboard/salon-dashboard-shell";
import { getDashboard } from "@/features/dashboard/getDashboard";

export default async function SalonOwnerDashboardPage() {
  const data = await getDashboard();
  return <SalonDashboardHome data={data} />;
}
