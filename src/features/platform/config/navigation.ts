import {
  Building2,
  ClipboardCheck,
  Download,
  LayoutDashboard,
  RefreshCw,
  Store,
} from "lucide-react";

import type { PlatformNavItem } from "../types";

/** Live platform-admin destinations only — placeholders omitted from production menus. */
export const platformNavItems: PlatformNavItem[] = [
  {
    title: "Dashboard",
    href: "/platform",
    icon: LayoutDashboard,
  },
  {
    title: "Businesses",
    href: "/platform/businesses",
    icon: Store,
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
    title: "Review",
    href: "/platform/review",
    icon: ClipboardCheck,
  },
  {
    title: "Signups",
    href: "/platform/tenants",
    icon: Building2,
  },
];
