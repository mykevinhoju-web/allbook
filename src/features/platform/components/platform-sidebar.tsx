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
import { platformConfig } from "@/config/site";

import { platformNavItems } from "../config/navigation";
import { isPlatformNavActive } from "../utils/navigation";

export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/platform" />}
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-sm font-bold text-primary-foreground shadow-sm">
                AB
              </span>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">
                  {platformConfig.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Super Admin
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isPlatformNavActive(item.href, pathname)}
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
          {platformConfig.productName}
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
