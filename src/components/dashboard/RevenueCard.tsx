import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { DashboardPerformanceMetric } from "@/features/dashboard";
import { cn } from "@/lib/utils";

type RevenueCardProps = {
  metrics: DashboardPerformanceMetric[];
  className?: string;
};

export function RevenueCard({ metrics, className }: RevenueCardProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:p-6",
        className,
      )}
    >
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-950">
          Performance
        </h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Revenue appears when salon payments are enabled.
        </p>
      </div>

      {metrics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-[#FAFBFC] px-4 py-10 text-center">
          <p className="text-[14px] font-medium text-neutral-800">
            No payment data yet
          </p>
          <p className="mt-1 text-[13px] text-neutral-500">
            Monthly revenue will show here once payments are connected.
          </p>
        </div>
      ) : (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.id}
            className="rounded-2xl border border-neutral-200 bg-[#FAFBFC] px-4 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-white hover:shadow-md"
          >
            <p className="text-[12px] font-medium text-neutral-500">
              {metric.label}
            </p>
            <p className="mt-2 text-[24px] font-semibold tracking-tight text-neutral-950 tabular-nums">
              {metric.value}
            </p>
            <p
              className={cn(
                "mt-2 inline-flex items-center gap-0.5 text-[12px] font-semibold",
                metric.direction === "up" && "text-emerald-600",
                metric.direction === "down" && "text-rose-600",
                metric.direction === "flat" && "text-neutral-500",
              )}
            >
              {metric.direction === "down" ? (
                <ArrowDownRight className="size-3.5" />
              ) : (
                <ArrowUpRight className="size-3.5" />
              )}
              {metric.change}
            </p>
          </article>
        ))}
      </div>
      )}
    </section>
  );
}
