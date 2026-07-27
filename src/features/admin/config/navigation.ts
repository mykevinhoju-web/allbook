import {
  BarChart3,
  CalendarDays,
  DoorOpen,
  Images,
  LayoutDashboard,
  LayoutGrid,
  Palette,
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
    title: "Guide sample",
    href: "/admin/bookings/samples/guide",
    icon: LayoutGrid,
  },
  {
    title: "Rooms",
    href: "/admin/rooms",
    icon: DoorOpen,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: UserCircle,
    module: "customers",
  },
  {
    title: "Gallery",
    href: "/admin/gallery",
    icon: Images,
    module: "gallery",
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Appearance",
    href: "/admin/appearance",
    icon: Palette,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    module: "settings",
  },
];
