import type { DashboardQuickAction } from "./types";

/** Static owner quick links — not mock stats. */
export const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    id: "add-service",
    label: "Add Service",
    description: "Grow your menu",
    href: "/platform/salon/services",
  },
  {
    id: "add-staff",
    label: "Add Staff",
    description: "Invite your team",
    href: "/platform/salon/staff",
  },
  {
    id: "edit-business",
    label: "Business Profile",
    description: "Hours & details",
    href: "/platform/salon/business",
  },
  {
    id: "bookings",
    label: "Bookings",
    description: "Manage appointments",
    href: "/platform/salon/bookings",
  },
  {
    id: "open-calendar",
    label: "Calendar",
    description: "Today’s schedule",
    href: "/platform/salon/calendar",
  },
];
