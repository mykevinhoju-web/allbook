import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  count?: number;
  className?: string;
};

function SalonCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#EEEAF8] bg-white shadow-[0_8px_28px_rgba(27,31,59,0.04)]">
      <Skeleton className="h-40 w-full rounded-none bg-[#EEEAF8] sm:h-44" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3 rounded-lg bg-[#EEEAF8]" />
            <Skeleton className="h-4 w-1/2 rounded-lg bg-[#F3F1FA]" />
          </div>
          <Skeleton className="h-10 w-14 rounded-lg bg-[#EEEAF8]" />
        </div>
        <Skeleton className="h-4 w-4/5 rounded-lg bg-[#F3F1FA]" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full bg-[#EEEAF8]" />
          <Skeleton className="h-5 w-24 rounded-full bg-[#EEEAF8]" />
          <Skeleton className="h-5 w-12 rounded-full bg-[#EEEAF8]" />
        </div>
        <Skeleton className="h-11 w-full rounded-2xl bg-[#EEEAF8]" />
      </div>
    </div>
  );
}

export function LoadingSkeleton({ count = 4, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("grid gap-4 sm:gap-5", className)} aria-busy aria-label="Loading salons">
      {Array.from({ length: count }).map((_, i) => (
        <SalonCardSkeleton key={i} />
      ))}
    </div>
  );
}
