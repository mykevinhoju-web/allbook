import {
  BarChart3,
  CalendarDays,
  Images,
  LayoutDashboard,
  Settings,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";

import type { AdminNavItem } from "../types";

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Staff",
    href: "/admin/staff",
    icon: Users,
  },
  {
    title: "Services",
    href: "/admin/services",
    icon: Wrench,
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: CalendarDays,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: UserCircle,
  },
  {
    title: "Gallery",
    href: "/admin/gallery",
    icon: Images,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];
