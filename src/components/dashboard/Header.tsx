"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ExternalLink,
  LogOut,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { SalonOwnerSession } from "@/features/dashboard";
import { cn } from "@/lib/utils";

type HeaderProps = {
  session: SalonOwnerSession;
  notificationCount?: number;
};

export function Header({ session, notificationCount = 3 }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-[#F7F8FA]/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-4 pl-16 sm:px-6 lg:h-[72px] lg:px-8 lg:pl-8">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight text-neutral-950 sm:text-[16px]">
            {session.salonName}
          </p>
          <p className="hidden truncate text-[12px] text-neutral-500 sm:block">
            Owner dashboard
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <label className="relative hidden min-w-[220px] md:block lg:min-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder="Search bookings, customers…"
              className="h-10 w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-[13px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:ring-4 focus:ring-neutral-950/5"
            />
          </label>

          <button
            type="button"
            className="relative flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
            aria-label="Notifications"
          >
            <Bell className="size-4" strokeWidth={1.75} />
            {notificationCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E11D48] px-1 text-[10px] font-semibold text-white">
                {notificationCount}
              </span>
            ) : null}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-3 transition",
                "hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md",
              )}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-neutral-950 text-[11px] font-semibold text-white">
                {session.ownerName
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-neutral-800 lg:inline">
                {session.ownerName}
              </span>
              <ChevronDown className="size-3.5 text-neutral-400" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1.5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]">
                <div className="border-b border-neutral-100 px-3.5 py-3">
                  <p className="text-[13px] font-semibold text-neutral-900">
                    {session.ownerName}
                  </p>
                  <p className="truncate text-[12px] text-neutral-500">
                    {session.ownerEmail}
                  </p>
                </div>
                <Link
                  href="/platform/salon/settings"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-neutral-700 transition hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="size-4 text-neutral-400" />
                  Settings
                </Link>
                <Link
                  href={session.publicPath}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-neutral-700 transition hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <ExternalLink className="size-4 text-neutral-400" />
                  Public page
                </Link>
                <Link
                  href="/platform/salon/settings"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-neutral-700 transition hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserRound className="size-4 text-neutral-400" />
                  Profile
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-rose-600 transition hover:bg-rose-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
