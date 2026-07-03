"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BookingAlertProvider } from "@/features/booking/context/booking-alert-provider";
import { PwaInstallHint } from "@/features/pwa";

import { AdminHeader } from "./admin-header";
import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  children: React.ReactNode;
  user?: {
    role: "admin" | "staff";
    loginId: string;
    name: string;
  } | null;
}

export function AdminShell({ children, user }: AdminShellProps) {
  const isStaff = user?.role === "staff";

  return (
    <BookingAlertProvider>
      <SidebarProvider defaultOpen={false}>
        <AdminSidebar isStaff={isStaff} />
        <SidebarInset className="min-h-svh bg-muted/30">
          <AdminHeader user={user} />
          <div className="flex flex-1 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-[env(safe-area-inset-bottom)]">
            <PwaInstallHint />
            {children}
          </div>
          <AdminMobileNav isStaff={isStaff} />
        </SidebarInset>
      </SidebarProvider>
    </BookingAlertProvider>
  );
}
