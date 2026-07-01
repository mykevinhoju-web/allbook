"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { platformConfig } from "@/config/site";

import { PlatformBreadcrumb } from "./platform-breadcrumb";

export function PlatformHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="hidden h-4 sm:block" />

      <Link
        href="/platform"
        className="hidden items-center gap-2 font-semibold tracking-tight sm:flex"
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground">
          AB
        </span>
        <span>{platformConfig.productName}</span>
      </Link>

      <Separator orientation="vertical" className="hidden h-4 md:block" />

      <div className="min-w-0 flex-1">
        <PlatformBreadcrumb pathname={pathname} />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-9 gap-2 px-2" />
            }
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-muted text-xs font-medium">
                SA
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
              Super Admin
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Super Admin</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    admin@allbook.com.au
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
            <DropdownMenuItem variant="destructive">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
