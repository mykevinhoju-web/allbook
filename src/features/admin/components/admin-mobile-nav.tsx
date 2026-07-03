"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  DoorOpen,
  LayoutGrid,
  Users,
  Wrench,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { isAdminNavActive } from "../utils/navigation";

const adminTabs = [
  { title: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { title: "Staff", href: "/admin/staff", icon: Users },
  { title: "Services", href: "/admin/services", icon: Wrench },
  { title: "Rooms", href: "/admin/rooms", icon: DoorOpen },
] as const;

interface AdminMobileNavProps {
  isStaff?: boolean;
}

export function AdminMobileNav({ isStaff = false }: AdminMobileNavProps) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const tabs = isStaff
    ? adminTabs.filter((tab) => tab.href === "/admin/bookings")
    : adminTabs;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Admin navigation"
    >
      <div
        className={cn(
          "mx-auto grid h-14 max-w-lg",
          isStaff ? "grid-cols-1" : "grid-cols-5",
        )}
      >
        {tabs.map((tab) => {
          const active = isAdminNavActive(tab.href, pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground",
              )}
            >
              <Icon className={cn("size-5", active && "stroke-[2.5]")} />
              <span>{tab.title}</span>
            </Link>
          );
        })}

        {!isStaff ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted-foreground active:text-foreground"
          >
            <LayoutGrid className="size-5" />
            <span>More</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
}
