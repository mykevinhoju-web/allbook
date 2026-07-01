"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BookingAlertProvider } from "@/features/booking/context/booking-alert-provider";
import { PwaInstallHint } from "@/features/pwa";

import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <BookingAlertProvider>
      <SidebarProvider defaultOpen>
        <AdminSidebar />
        <SidebarInset className="min-h-svh bg-muted/30">
          <AdminHeader />
          <div className="flex flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
            <PwaInstallHint />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </BookingAlertProvider>
  );
}
