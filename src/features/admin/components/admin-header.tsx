"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, LogOut, Settings, Smartphone, User } from "lucide-react";

import { AppButton } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBookingAlerts } from "@/features/booking/context/booking-alert-provider";
import {
  isIos,
  isStandalonePwa,
  usePwaInstall,
} from "@/features/pwa";
import { useTenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

import { isAdminModuleEnabled } from "../lib/admin-modules";
import { getAdminPageTitle } from "../utils/navigation";
import { AdminBreadcrumb } from "./admin-breadcrumb";

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
  const { canInstall, install } = usePwaInstall();
  const { alertsEnabled, isListening, bellActive, connectionStatus, testSound } =
    useBookingAlerts();
  const [showInstallAction, setShowInstallAction] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  const displayName = user?.name ?? "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();
  const pageTitle = getAdminPageTitle(pathname);
  const settingsEnabled = isAdminModuleEnabled(tenant, "settings");

  useEffect(() => {
    setShowInstallAction(!isStandalonePwa());
  }, []);

  const openInstallHelp = async () => {
    if (isIos()) {
      setIosGuideOpen(true);
      return;
    }
    if (canInstall) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
      return;
    }
    setIosGuideOpen(true);
  };

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
    <>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:gap-3 sm:px-4">
        <SidebarTrigger className="-ml-1 size-9 shrink-0" aria-label="Open menu" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold tracking-tight lg:hidden">
            {pageTitle}
          </p>
          <div className="hidden lg:block">
            <AdminBreadcrumb pathname={pathname} />
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {showInstallAction ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg border-primary/30 bg-primary/5 px-2 text-xs text-primary"
              disabled={installing}
              onClick={() => void openInstallHelp()}
            >
              <Smartphone className="size-3.5" />
              <span className="hidden sm:inline">Home Screen</span>
            </Button>
          ) : null}
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
                isListening
                  ? "bg-emerald-500"
                  : connectionStatus === "CHANNEL_ERROR"
                    ? "bg-red-500"
                    : "bg-amber-500",
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
                      {user?.loginId
                        ? user.loginId
                        : tenant.branding.displayName}
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
                {settingsEnabled ? (
                  <DropdownMenuItem>
                    <Settings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                ) : null}
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

      <Dialog open={iosGuideOpen} onOpenChange={setIosGuideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Home Screen</DialogTitle>
            <DialogDescription>
              Do this once, then open Admin from the home icon and turn on
              alerts.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>
              Tap the <strong>Share</strong> button
              {isIos() ? " at the bottom of Safari" : " in the browser menu"}
            </li>
            <li>
              Scroll and tap <strong>Add to Home Screen</strong>
            </li>
            <li>
              Tap <strong>Add</strong>, then open the new icon
            </li>
            <li>
              Tap <strong>Turn on alerts</strong> inside the app
            </li>
          </ol>
          <AppButton
            type="button"
            className="mt-2 h-10 w-full rounded-xl"
            onClick={() => setIosGuideOpen(false)}
          >
            Got it
          </AppButton>
        </DialogContent>
      </Dialog>
    </>
  );
}
