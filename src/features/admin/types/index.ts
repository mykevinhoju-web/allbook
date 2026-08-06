import type { LucideIcon } from "lucide-react";

import type { AdminModuleId } from "../lib/admin-modules";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  module?: AdminModuleId;
}

export interface AdminStatCardData {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}
