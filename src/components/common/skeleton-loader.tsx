import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps extends React.ComponentProps<"div"> {
  lines?: number;
  showAvatar?: boolean;
  showButton?: boolean;
}

export function SkeletonLoader({
  lines = 3,
  showAvatar = false,
  showButton = false,
  className,
  ...props
}: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {showAvatar ? (
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="h-3 w-1/4 rounded-lg" />
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn(
              "h-4 rounded-lg",
              index === lines - 1 ? "w-2/3" : "w-full",
            )}
          />
        ))}
      </div>
      {showButton ? <Skeleton className="h-10 w-28 rounded-xl" /> : null}
    </div>
  );
}

interface SkeletonCardProps extends React.ComponentProps<"div"> {
  rows?: number;
}

export function SkeletonCard({ rows = 4, className, ...props }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card p-6 shadow-soft",
        className,
      )}
      {...props}
    >
      <SkeletonLoader lines={rows} />
    </div>
  );
}

interface SkeletonTableProps extends React.ComponentProps<"div"> {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft",
        className,
      )}
      {...props}
    >
      <div className="border-b border-border/60 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 flex-1 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton };
