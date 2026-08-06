import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  CalendarRange,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { DashboardQuickAction } from "@/features/dashboard";
import { cn } from "@/lib/utils";

const ACTION_ICONS: Record<string, LucideIcon> = {
  "add-service": Briefcase,
  "add-staff": Users,
  "open-calendar": CalendarDays,
  "edit-business": Store,
  bookings: CalendarRange,
};

type QuickActionsProps = {
  actions: DashboardQuickAction[];
  className?: string;
};

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-950">
            Quick actions
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            Jump into the most common owner tasks.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {actions.map((action) => {
          const Icon = ACTION_ICONS[action.id] ?? Briefcase;
          return (
            <Link
              key={action.id}
              href={action.href}
              className="group rounded-2xl border border-neutral-200 bg-[#FAFBFC] px-4 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-white hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-neutral-950 text-white transition group-hover:scale-[1.04]">
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
              <p className="mt-3 text-[13px] font-semibold text-neutral-950">
                {action.label}
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
