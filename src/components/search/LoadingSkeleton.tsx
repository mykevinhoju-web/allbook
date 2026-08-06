import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  count?: number;
  className?: string;
};

function SalonCardSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-neutral-200/80 bg-white sm:grid-cols-[148px_minmax(0,1fr)]">
      <Skeleton className="h-36 rounded-none bg-neutral-100 sm:h-full sm:min-h-[148px]" />
      <div className="space-y-3 p-4">
        <div className="flex justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 rounded-md bg-neutral-100" />
            <Skeleton className="h-3 w-1/3 rounded-md bg-neutral-100" />
          </div>
          <Skeleton className="h-8 w-12 rounded-md bg-neutral-100" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12 rounded-full bg-neutral-100" />
          <Skeleton className="h-5 w-14 rounded-full bg-neutral-100" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl bg-neutral-100" />
      </div>
    </div>
  );
}

export function LoadingSkeleton({ count = 5, className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn("grid gap-3 sm:gap-4", className)}
      aria-busy
      aria-label="Loading salons"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SalonCardSkeleton key={i} />
      ))}
    </div>
  );
}
