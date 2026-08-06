import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  Camera,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  MessageSquareHeart,
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

export const SALON_DASHBOARD_NAV: SalonDashboardNavItem[] = [
  {
    title: "Dashboard",
    href: "/platform/salon",
    icon: LayoutDashboard,
  },
  {
    title: "Bookings",
    href: "/platform/salon/bookings",
    icon: ClipboardList,
  },
  {
    title: "Calendar",
    href: "/platform/salon/calendar",
    icon: CalendarDays,
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
    title: "Gallery",
    href: "/platform/salon/gallery",
    icon: Camera,
  },
  {
    title: "Customers",
    href: "/platform/salon/customers",
    icon: UserRound,
  },
  {
    title: "Reviews",
    href: "/platform/salon/reviews",
    icon: MessageSquareHeart,
  },
  {
    title: "Business",
    href: "/platform/salon/business",
    icon: Store,
  },
  {
    title: "Marketing",
    href: "/platform/salon/marketing",
    icon: Megaphone,
  },
  {
    title: "Analytics",
    href: "/platform/salon/analytics",
    icon: BarChart3,
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
