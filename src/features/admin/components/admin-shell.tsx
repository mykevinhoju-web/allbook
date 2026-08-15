"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  BookingAlertProvider,
  useBookingAlerts,
} from "@/features/booking/context/booking-alert-provider";

import { AdminExtendRequestWatcher } from "./admin-extend-request-watcher";
import { AdminHeader } from "./admin-header";
import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminPwaInstallBubble } from "./admin-pwa-install-bubble";
import { AdminServiceEndWatcher } from "./admin-service-end-watcher";
import { AdminStaffPresenceWatcher } from "./admin-staff-presence-watcher";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  children: React.ReactNode;
  user?: {
    role: "admin" | "staff";
    loginId: string;
    name: string;
  } | null;
}

function AdminNewBookingBadgeSync() {
  const pathname = usePathname();
  const { setNewBookingBadgeSuppressed } = useBookingAlerts();

  useEffect(() => {
    const onBookings = pathname.startsWith("/admin/bookings");
    setNewBookingBadgeSuppressed(onBookings);
    return () => setNewBookingBadgeSuppressed(false);
  }, [pathname, setNewBookingBadgeSuppressed]);

  return null;
}

function AdminReportsUnlockClear() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin/reports")) return;
    void fetch("/api/admin/reports/unlock", { method: "DELETE" });
  }, [pathname]);

  return null;
}

export function AdminShell({ children, user }: AdminShellProps) {
  const isStaff = user?.role === "staff";

  return (
    <BookingAlertProvider>
      <AdminNewBookingBadgeSync />
      <AdminReportsUnlockClear />
      <AdminServiceEndWatcher />
      <AdminExtendRequestWatcher />
      <AdminStaffPresenceWatcher />
      <SidebarProvider defaultOpen>
        <AdminSidebar isStaff={isStaff} />
        <SidebarInset className="h-svh min-h-0 overflow-hidden bg-muted/30">
          <AdminHeader user={user} />
          <AdminPwaInstallBubble />
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
            {children}
          </div>
        </SidebarInset>
        <AdminMobileNav isStaff={isStaff} />
      </SidebarProvider>
    </BookingAlertProvider>
  );
}
