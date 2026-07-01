import { AppCard } from "@/components/common";

import {
  platformDashboardStatCards,
  recentTenantsMock,
} from "../config/dashboard";
import { PlatformPageHeader } from "./platform-page-header";
import { PlatformStatCard } from "./platform-stat-card";
import { RecentTenantsTable } from "./recent-tenants-table";

export function PlatformDashboardContent() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PlatformPageHeader
        title="Dashboard"
        description="Platform-wide overview of tenants, bookings, and revenue."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {platformDashboardStatCards.map((stat) => (
          <PlatformStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <AppCard className="border-border/60 p-4 shadow-soft sm:p-6">
        <RecentTenantsTable tenants={recentTenantsMock} />
      </AppCard>
    </div>
  );
}
