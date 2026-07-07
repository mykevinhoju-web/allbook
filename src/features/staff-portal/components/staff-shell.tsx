"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/common";
import { BookingAlertProvider } from "@/features/booking/context/booking-alert-provider";
import { PwaInstallHint } from "@/features/pwa";
import { useTenant } from "@/features/tenants";

interface StaffShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    staffId: string;
  } | null;
}

export function StaffShell({ children, user }: StaffShellProps) {
  const tenant = useTenant();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/staff/auth/logout", { method: "POST" });
    router.replace("/staff/login");
    router.refresh();
  };

  return (
    <BookingAlertProvider filterStaffId={user?.staffId ?? null}>
      <div className="flex min-h-svh flex-col bg-muted/30">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.name ?? "Staff"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {tenant.branding.displayName}
              </p>
            </div>
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-xl"
              onClick={() => void logout()}
            >
              <LogOut className="size-4" />
              Sign out
            </AppButton>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <PwaInstallHint />
          {children}
        </main>
      </div>
    </BookingAlertProvider>
  );
}
