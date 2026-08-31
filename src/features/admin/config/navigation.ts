import {
  BarChart3,
  CalendarDays,
  DoorOpen,
  LayoutDashboard,
  ListOrdered,
  Palette,
  StickyNote,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";

import type { AdminNavItem } from "../types";

/** Ever (Everwell Massage) — simple site booking admin only. */
export const everAdminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: CalendarDays,
  },
  {
    title: "Services",
    href: "/admin/services",
    icon: Wrench,
  },
];

/** Live tenant-admin destinations only — placeholders omitted from production menus. */
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
    title: "Price",
    href: "/admin/services",
    icon: Wrench,
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: CalendarDays,
  },
  {
    title: "Rotation",
    href: "/admin/rotation",
    icon: ListOrdered,
  },
  {
    title: "Note",
    href: "/admin/notes",
    icon: StickyNote,
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
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Appearance",
    href: "/admin/appearance",
    icon: Palette,
  },
];
