import { Building2, CircleCheck, Sparkles, Users } from "lucide-react";

import { AppCard } from "@/components/common";

import { getPlatformSignupStats } from "../server/list-signups";
import { PlatformPageHeader } from "./platform-page-header";
import { PlatformStatCard } from "./platform-stat-card";
import { SignupsTable } from "./signups-table";

export async function PlatformDashboardContent() {
  const stats = await getPlatformSignupStats();

  const cards = [
    {
      title: "Total signups",
      value: String(stats.totalTenants),
      description: "Businesses on AllBook",
      icon: Building2,
    },
    {
      title: "Active",
      value: String(stats.activeTenants),
      description: "Active tenant accounts",
      icon: CircleCheck,
    },
    {
      title: "Free trials",
      value: String(stats.freeTrials),
      description: "Currently on free trial",
      icon: Sparkles,
    },
    {
      title: "Owners listed",
      value: String(stats.totalTenants),
      description: "Signup contacts on file",
      icon: Users,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PlatformPageHeader
        title="AllBook Admin"
        description="Overview of businesses that signed up for AllBook."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((stat) => (
          <PlatformStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <AppCard className="border-border/60 p-4 shadow-soft sm:p-6">
        <SignupsTable
          tenants={stats.recent}
          title="Recent signups"
          description="Newest free-trial and paid businesses."
          showViewAll
        />
      </AppCard>
    </div>
  );
}
