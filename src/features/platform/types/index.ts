import type { LucideIcon } from "lucide-react";

export interface PlatformNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export type PlatformTenantStatus = "active" | "pending" | "suspended";

export interface PlatformTenantRow {
  id: string;
  name: string;
  slug: string;
  status: PlatformTenantStatus;
  createdAt: string;
  subscription: string;
}

export interface PlatformDashboardStats {
  totalTenants: number;
  activeTenants: number;
  todaysBookings: number;
  monthlyRevenue: string;
}

export interface PlatformDashboardStatCard {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}
