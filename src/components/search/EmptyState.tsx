import { Loader2, SearchX } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  onReset?: () => void;
  onRetry?: () => void;
  /** First search in an area often triggers background Google fill. */
  discovering?: boolean;
  locationLabel?: string;
  className?: string;
};

export function EmptyState({
  onReset,
  onRetry,
  discovering = false,
  locationLabel,
  className,
}: EmptyStateProps) {
  const place = locationLabel?.trim();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200/80">
        {discovering ? (
          <Loader2
            className="size-7 animate-spin text-[#6B5CF6]"
            strokeWidth={1.6}
          />
        ) : (
          <SearchX className="size-7 text-[#6B5CF6]" strokeWidth={1.6} />
        )}
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
        {discovering
          ? place
            ? `Finding salons near ${place}`
            : "Finding salons in this area"
          : "No salons found"}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
        {discovering
          ? "We’re loading businesses into AllBook for this area. This usually takes a few seconds — tap Refresh shortly."
          : "Try another suburb, or ask an admin to pre-import this area so first searches aren’t empty."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center rounded-xl bg-[#6B5CF6] px-4 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Refresh results
          </button>
        ) : null}
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            Clear search
          </button>
        ) : null}
      </div>
    </div>
  );
}
