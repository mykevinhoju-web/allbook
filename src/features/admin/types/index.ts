import type { LucideIcon } from "lucide-react";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminStatCardData {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}
