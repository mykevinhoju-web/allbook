"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTenant } from "@/features/tenants";
import { useBookingAlerts } from "@/features/booking/context/booking-alert-provider";

import { AdminBreadcrumb } from "./admin-breadcrumb";
import { getAdminPageTitle } from "../utils/navigation";

interface AdminHeaderProps {
  user?: {
    role: "admin" | "staff";
    loginId: string;
    name: string;
  } | null;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tenant = useTenant();
  const { alertsEnabled, isListening, bellActive, connectionStatus, testSound } =
    useBookingAlerts();

  const displayName = user?.name ?? "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();
  const pageTitle = getAdminPageTitle(pathname);

  const signOut = async () => {
    const endpoints =
      user?.role === "staff"
        ? ["/api/staff/auth/logout"]
        : ["/api/admin/auth/logout", "/api/staff/auth/logout"];

    await Promise.all(
      endpoints.map((endpoint) => fetch(endpoint, { method: "POST" })),
    );

    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/75 sm:gap-3 sm:px-4">
      <SidebarTrigger className="-ml-1 size-9 lg:hidden" />

      <Link
        href="/admin"
        className="hidden min-w-0 items-center gap-2 font-semibold tracking-tight lg:flex"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          {tenant.branding.logoInitials}
        </span>
        <span className="truncate">{tenant.branding.displayName}</span>
      </Link>

      <Separator orientation="vertical" className="hidden h-4 lg:block" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold tracking-tight lg:hidden">
          {pageTitle}
        </p>
        <div className="hidden lg:block">
          <AdminBreadcrumb pathname={pathname} />
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {alertsEnabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden h-8 rounded-lg px-2 text-xs xl:inline-flex"
            onClick={() => void testSound()}
          >
            Test sound
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-9"
          onClick={() => {
            if (alertsEnabled) void testSound();
          }}
        >
          <Bell
            className={cn("size-4", bellActive && "animate-pulse text-primary")}
          />
          <span
            className={cn(
              "absolute top-2 right-2 size-1.5 rounded-full",
              alertsEnabled && isListening
                ? "bg-emerald-500"
                : alertsEnabled && connectionStatus === "CHANNEL_ERROR"
                  ? "bg-red-500"
                  : alertsEnabled
                    ? "bg-amber-500"
                    : "bg-muted-foreground/40",
            )}
          />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="relative h-9 gap-2 px-1.5 sm:px-2"
              />
            }
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-muted text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">
              {displayName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.loginId ?? `admin@${tenant.slug}.allbook.com.au`}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
