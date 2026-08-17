"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type StaffPortalTab = "day" | "month" | "report";

export function StaffPortalTabs({ active }: { active: StaffPortalTab }) {
  const items = [
    { key: "day" as const, href: "/staff", label: "Daily" },
    { key: "month" as const, href: "/staff?view=month", label: "Monthly" },
    { key: "report" as const, href: "/staff/reports", label: "Report" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/70 p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition",
            active === item.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
