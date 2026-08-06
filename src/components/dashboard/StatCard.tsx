import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import type { DashboardStat } from "@/features/dashboard";
import { cn } from "@/lib/utils";

type StatCardProps = {
  stat: DashboardStat;
  className?: string;
};

export function StatCard({ stat, className }: StatCardProps) {
  const trend = stat.trend;

  return (
    <article
      className={cn(
        "group rounded-[22px] border border-neutral-200/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] transition duration-300",
        "hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_24px_50px_-30px_rgba(15,23,42,0.5)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-neutral-500">{stat.label}</p>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              trend.direction === "up" && "bg-emerald-50 text-emerald-700",
              trend.direction === "down" && "bg-rose-50 text-rose-700",
              trend.direction === "flat" && "bg-neutral-100 text-neutral-600",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="size-3" />
            ) : trend.direction === "down" ? (
              <ArrowDownRight className="size-3" />
            ) : (
              <ArrowRight className="size-3" />
            )}
            {trend.value === 0 ? "—" : `${trend.value}%`}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-tight text-neutral-950 tabular-nums">
        {stat.value}
      </p>
      {stat.hint ? (
        <p className="mt-2 text-[12px] text-neutral-500">{stat.hint}</p>
      ) : null}
      {trend ? (
        <p className="mt-3 text-[11px] text-neutral-400">{trend.label}</p>
      ) : null}
    </article>
  );
}
