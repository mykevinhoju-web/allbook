import { dashboardStats } from "../config/dashboard";
import { AdminPageHeader } from "./admin-page-header";
import { AdminStatCard } from "./admin-stat-card";

export function AdminDashboardContent() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:gap-6 lg:p-6">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your platform performance today."
      />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <AdminStatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
