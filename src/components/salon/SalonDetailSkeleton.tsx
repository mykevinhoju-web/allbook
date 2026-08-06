import { Skeleton } from "@/components/ui/skeleton";

export function SalonDetailSkeleton() {
  return (
    <div className="min-h-svh bg-[#F6F6F7]">
      <Skeleton className="h-[min(68vh,560px)] w-full rounded-none sm:h-[520px]" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
        <Skeleton className="hidden h-80 rounded-3xl lg:block" />
      </div>
    </div>
  );
}
