import {
  Building2,
  ClipboardCheck,
  Download,
  Handshake,
  LayoutDashboard,
  RefreshCw,
  Settings,
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
    title: "Partners",
    href: "/platform/partners",
    icon: Handshake,
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
  {
    title: "Settings",
    href: "/platform/settings",
    icon: Settings,
  },
];
