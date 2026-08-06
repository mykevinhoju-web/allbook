"use client";

import { usePathname } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { PlatformHeader } from "./platform-header";
import { PlatformSidebar } from "./platform-sidebar";

interface PlatformShellProps {
  children: React.ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps) {
  const pathname = usePathname();

  if (
    pathname === "/platform/login" ||
    pathname === "/platform/salon" ||
    pathname.startsWith("/platform/salon/") ||
    pathname === "/platform/customer" ||
    pathname.startsWith("/platform/customer/")
  ) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen>
      <PlatformSidebar />
      <SidebarInset className="min-h-svh bg-[#f6f9fc] dark:bg-background">
        <PlatformHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
