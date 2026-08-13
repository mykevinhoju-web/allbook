"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, LogOut } from "lucide-react";

import { AppButton } from "@/components/common";
import { BookingAlertProvider } from "@/features/booking/context/booking-alert-provider";
import { PwaInstallHint } from "@/features/pwa";
import { useTenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();

  const logout = async () => {
    await fetch("/api/staff/auth/logout", { method: "POST" });
    router.replace("/staff/login");
    router.refresh();
  };

  const nav = [
    { href: "/staff", label: "Schedule", icon: CalendarDays, exact: true },
    { href: "/staff/reports", label: "Reports", icon: BarChart3, exact: false },
  ] as const;

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

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          <PwaInstallHint />
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto grid w-full max-w-lg grid-cols-2">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </BookingAlertProvider>
  );
}
