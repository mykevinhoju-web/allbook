"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  DoorOpen,
  LayoutDashboard,
  LayoutGrid,
  ListOrdered,
  Users,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { useBookingAlerts } from "@/features/booking/context/booking-alert-provider";
import { cn } from "@/lib/utils";

import { isAdminNavActive } from "../utils/navigation";
import { AdminNavBadge } from "./admin-nav-badge";

/** Primary tabs — same on every admin page below `lg`. */
const adminTabs = [
  { title: "Home", href: "/admin", icon: LayoutDashboard },
  { title: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { title: "Staff", href: "/admin/staff", icon: Users },
  { title: "Rotation", href: "/admin/rotation", icon: ListOrdered },
  { title: "Rooms", href: "/admin/rooms", icon: DoorOpen },
] as const;

interface AdminMobileNavProps {
  isStaff?: boolean;
}

export function AdminMobileNav({ isStaff = false }: AdminMobileNavProps) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const { newBookingCount } = useBookingAlerts();
  const tabs = isStaff
    ? adminTabs.filter((tab) => tab.href === "/admin/bookings")
    : adminTabs;

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden"
      aria-label="Admin navigation"
    >
      <div className="pointer-events-auto border-t border-border/70 bg-background pb-[env(safe-area-inset-bottom)]">
        <div
          className={cn(
            "mx-auto grid h-14 max-w-lg",
            isStaff ? "grid-cols-1" : "grid-cols-6",
          )}
        >
          {tabs.map((tab) => {
            const active = isAdminNavActive(tab.href, pathname);
            const Icon = tab.icon;
            const showBadge =
              tab.href === "/admin/bookings" && newBookingCount > 0;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-5", active && "stroke-[2.5]")} />
                  {showBadge ? (
                    <AdminNavBadge
                      count={newBookingCount}
                      className="absolute -right-3 -top-2 h-4 min-w-4"
                    />
                  ) : null}
                </span>
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
      </div>
    </nav>
  );
}
