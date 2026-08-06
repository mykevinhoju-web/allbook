"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useBookingAlerts } from "@/features/booking/context/booking-alert-provider";
import { useTenant } from "@/features/tenants";

import { getAdminNavItemsForTenant } from "../lib/admin-modules";
import { isAdminNavActive } from "../utils/navigation";
import {
  AdminNavBadge,
  formatAdminNavBadgeCount,
} from "./admin-nav-badge";

export function AdminSidebar({ isStaff = false }: { isStaff?: boolean }) {
  const pathname = usePathname();
  const tenant = useTenant();
  const { setOpenMobile } = useSidebar();
  const { newBookingCount } = useBookingAlerts();
  const navItems = getAdminNavItemsForTenant(tenant, { isStaff });

  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/admin" onClick={closeMobile} />}
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                {tenant.branding.logoInitials}
              </span>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">
                  {tenant.branding.displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Admin Console
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const showBadge =
                  item.href === "/admin/bookings" && newBookingCount > 0;
                const badgeLabel = formatAdminNavBadgeCount(newBookingCount);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isAdminNavActive(item.href, pathname)}
                      tooltip={
                        showBadge
                          ? `${item.title} (${badgeLabel} new)`
                          : item.title
                      }
                      render={<Link href={item.href} onClick={closeMobile} />}
                    >
                      <span className="relative">
                        <item.icon />
                        {showBadge ? (
                          <span className="absolute -right-1.5 -top-1.5 hidden size-2 rounded-full bg-red-500 group-data-[collapsible=icon]:block" />
                        ) : null}
                      </span>
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {showBadge ? (
                      <SidebarMenuBadge className="!bg-transparent p-0">
                        <AdminNavBadge count={newBookingCount} />
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-muted-foreground">
          {tenant.branding.displayName} administration
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
