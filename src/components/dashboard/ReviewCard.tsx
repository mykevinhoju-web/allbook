import Link from "next/link";
import { Star } from "lucide-react";

import type { DashboardReviewSummary } from "@/features/dashboard";
import { cn } from "@/lib/utils";

type ReviewCardProps = {
  reviews: DashboardReviewSummary;
  className?: string;
};

export function ReviewCard({ reviews, className }: ReviewCardProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-950">
            Reviews
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            Reputation at a glance
          </p>
        </div>
        <Link
          href="/platform/salon/reviews"
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          Manage
        </Link>
      </div>

      <div className="mt-5 flex items-end gap-3">
        <p className="text-[40px] font-semibold tracking-tight text-neutral-950 tabular-nums">
          {reviews.averageRating.toFixed(1)}
        </p>
        <div className="mb-2 flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={cn(
                "size-4",
                index < Math.round(reviews.averageRating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-neutral-200 text-neutral-200",
              )}
            />
          ))}
        </div>
      </div>

      <p className="mt-1 text-[12px] text-neutral-500">
        {reviews.totalReviews} reviews · {reviews.pendingCount} pending replies
      </p>

      <blockquote className="mt-5 rounded-2xl border border-neutral-200 bg-[#FAFBFC] px-4 py-3 text-[13px] leading-relaxed text-neutral-700">
        {reviews.recentHighlight}
      </blockquote>
    </section>
  );
}
