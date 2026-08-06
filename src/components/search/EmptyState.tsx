import { SearchX, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  onReset?: () => void;
  className?: string;
};

export function EmptyState({ onReset, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E0DCF5] bg-gradient-to-b from-[#FAFAFE] to-white px-6 py-16 text-center",
        className,
      )}
    >
      <div className="relative mb-6">
        <div className="flex size-24 items-center justify-center rounded-[2rem] bg-[#EEF2FF] shadow-inner">
          <SearchX className="size-10 text-[#6B5CF6]" strokeWidth={1.6} />
        </div>
        <span className="absolute -right-1 -top-1 flex size-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-[#E8E6F2]">
          <Sparkles className="size-3.5 text-[#EC4899]" />
        </span>
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-[#1B1F3B]">
        No salons found
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#6B7289]">
        Try a different suburb, clear your filters, or broaden the service type
        to discover more beauty spots nearby.
      </p>

      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex h-11 items-center rounded-2xl bg-[#6B5CF6] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(107,92,246,0.28)] transition hover:opacity-95"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
