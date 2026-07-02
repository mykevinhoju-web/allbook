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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useTenant } from "@/features/tenants";

import { adminNavItems } from "../config/navigation";
import { isAdminNavActive } from "../utils/navigation";

export function AdminSidebar({ isStaff = false }: { isStaff?: boolean }) {
  const pathname = usePathname();
  const tenant = useTenant();
  const navItems = isStaff
    ? adminNavItems.filter((item) => item.href === "/admin/bookings")
    : adminNavItems;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/admin" />}
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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isAdminNavActive(item.href, pathname)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {tenant.branding.displayName} administration
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
