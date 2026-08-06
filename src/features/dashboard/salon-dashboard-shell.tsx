"use client";

import {
  BookingTable,
  CalendarWidget,
  Header,
  QuickActions,
  RevenueCard,
  ReviewCard,
  Sidebar,
  StatCard,
} from "@/components/dashboard";
import type { SalonDashboardData } from "@/features/dashboard";

type SalonDashboardShellProps = {
  session: SalonDashboardData["session"];
  children: React.ReactNode;
};

export function SalonDashboardShell({
  session,
  children,
}: SalonDashboardShellProps) {
  return (
    <div className="flex min-h-svh bg-[#F7F8FA] text-neutral-950">
      <Sidebar
        salonName={session.salonName}
        categoryLabel={session.categoryLabel}
        publicPath={session.publicPath}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header session={session} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

type SalonDashboardHomeProps = {
  data: SalonDashboardData;
};

export function SalonDashboardHome({ data }: SalonDashboardHomeProps) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 lg:space-y-8">
      <div className="space-y-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Overview
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
          Good afternoon, {data.session.ownerName.split(" ")[0]}
        </h1>
        <p className="text-[14px] text-neutral-500">
          Here&apos;s how {data.session.salonName} is performing today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <QuickActions actions={data.quickActions} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <BookingTable bookings={data.recentBookings} />
        <CalendarWidget slots={data.calendar} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <RevenueCard metrics={data.performance} />
        <ReviewCard reviews={data.reviews} />
      </div>
    </div>
  );
}
