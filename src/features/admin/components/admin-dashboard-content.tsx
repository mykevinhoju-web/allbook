import { dashboardStats } from "../config/dashboard";
import { AdminPageHeader } from "./admin-page-header";
import { AdminStatCard } from "./admin-stat-card";

export function AdminDashboardContent() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your platform performance today."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <AdminStatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
