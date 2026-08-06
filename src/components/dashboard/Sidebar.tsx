"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import {
  SALON_DASHBOARD_NAV,
  isSalonNavActive,
} from "@/features/dashboard";
import { cn } from "@/lib/utils";

type SidebarProps = {
  salonName: string;
  categoryLabel?: string;
  publicPath?: string;
};

export function Sidebar({
  salonName,
  categoryLabel = "Salon",
  publicPath = "/",
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-[#111318] text-white shadow-lg lg:hidden"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-[#0B0D12] text-white transition-transform duration-300 ease-out lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-white/8 px-5 py-6">
          <Link
            href="/platform/salon"
            className="group flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5B8CFF] to-[#3B6AE8] text-[13px] font-bold shadow-[0_10px_30px_-12px_rgba(91,140,255,0.9)] transition group-hover:scale-[1.03]">
              AB
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">
                {salonName}
              </p>
              <p className="truncate text-[12px] text-white/45">
                {categoryLabel} · Owner
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {SALON_DASHBOARD_NAV.map((item) => {
            const active = isSalonNavActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition duration-200",
                  active
                    ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                    : "text-white/55 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 transition",
                    active
                      ? "text-[#8EB0FF]"
                      : "text-white/40 group-hover:text-white/80",
                  )}
                  strokeWidth={1.75}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/8 p-4">
          <Link
            href={publicPath}
            className="block rounded-2xl bg-white/5 px-4 py-3 transition hover:bg-white/8"
          >
            <p className="text-[12px] font-medium text-white/45">Public page</p>
            <p className="mt-0.5 text-[13px] font-semibold text-white/90">
              View live listing →
            </p>
          </Link>
        </div>
      </aside>
    </>
  );
}
