import { SearchX } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  onReset?: () => void;
  className?: string;
};

export function EmptyState({ onReset, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200/80">
        <SearchX className="size-7 text-[#6B5CF6]" strokeWidth={1.6} />
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
        No salons found
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
        Try another suburb or clear the service filter to see more results.
      </p>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex h-10 items-center rounded-xl bg-[#6B5CF6] px-4 text-sm font-semibold text-white transition hover:opacity-95"
        >
          Clear search
        </button>
      ) : null}
    </div>
  );
}
