"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { PlatformHeader } from "./platform-header";
import { PlatformSidebar } from "./platform-sidebar";

interface PlatformShellProps {
  children: React.ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps) {
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
