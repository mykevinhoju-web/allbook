import {
  BarChart3,
  Building2,
  CreditCard,
  Download,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";

import type { PlatformNavItem } from "../types";

export const platformNavItems: PlatformNavItem[] = [
  {
    title: "Dashboard",
    href: "/platform",
    icon: LayoutDashboard,
  },
  {
    title: "Import",
    href: "/platform/import",
    icon: Download,
  },
  {
    title: "Sync",
    href: "/platform/sync",
    icon: RefreshCw,
  },
  {
    title: "Signups",
    href: "/platform/tenants",
    icon: Building2,
  },
  {
    title: "Subscription",
    href: "/platform/subscription",
    icon: CreditCard,
  },
  {
    title: "Users",
    href: "/platform/users",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/platform/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/platform/settings",
    icon: Settings,
  },
];
