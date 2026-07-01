import {
  Building2,
  CalendarDays,
  CircleCheck,
  DollarSign,
} from "lucide-react";

import type {
  PlatformDashboardStatCard,
  PlatformDashboardStats,
  PlatformTenantRow,
} from "../types";

export const platformDashboardStats: PlatformDashboardStats = {
  totalTenants: 1,
  activeTenants: 1,
  todaysBookings: 24,
  monthlyRevenue: "$12,480",
};

export const platformDashboardStatCards: PlatformDashboardStatCard[] = [
  {
    title: "Total Tenants",
    value: String(platformDashboardStats.totalTenants),
    description: "Organizations on the platform",
    icon: Building2,
  },
  {
    title: "Active Tenants",
    value: String(platformDashboardStats.activeTenants),
    description: "Currently subscribed",
    icon: CircleCheck,
  },
  {
    title: "Today's Bookings",
    value: String(platformDashboardStats.todaysBookings),
    description: "Across all tenants",
    icon: CalendarDays,
  },
  {
    title: "Monthly Revenue",
    value: platformDashboardStats.monthlyRevenue,
    description: "Platform subscription revenue",
    icon: DollarSign,
  },
];

export const recentTenantsMock: PlatformTenantRow[] = [
  {
    id: "tenant-001",
    name: "DaySpa",
    slug: "dayspa",
    status: "active",
    createdAt: "2026-07-01",
    subscription: "Professional",
  },
];
