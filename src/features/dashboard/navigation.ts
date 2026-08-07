import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  LayoutDashboard,
  Settings,
  Store,
  Users,
  UserRound,
} from "lucide-react";

export type SalonDashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

/** Live salon-owner destinations only — placeholders omitted from production menus. */
export const SALON_DASHBOARD_NAV: SalonDashboardNavItem[] = [
  {
    title: "Dashboard",
    href: "/platform/salon",
    icon: LayoutDashboard,
  },
  {
    title: "Services",
    href: "/platform/salon/services",
    icon: Briefcase,
  },
  {
    title: "Staff",
    href: "/platform/salon/staff",
    icon: Users,
  },
  {
    title: "Customers",
    href: "/platform/salon/customers",
    icon: UserRound,
  },
  {
    title: "Business",
    href: "/platform/salon/business",
    icon: Store,
  },
  {
    title: "Settings",
    href: "/platform/salon/settings",
    icon: Settings,
  },
];

export function isSalonNavActive(href: string, pathname: string): boolean {
  if (href === "/platform/salon") {
    return pathname === "/platform/salon";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
