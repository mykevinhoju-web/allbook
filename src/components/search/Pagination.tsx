"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** How many page buttons to show at once. Default 5. */
  windowSize?: number;
};

function visiblePageWindow(
  page: number,
  totalPages: number,
  windowSize: number,
): number[] {
  const size = Math.max(1, windowSize);
  const windowIndex = Math.floor((page - 1) / size);
  const start = windowIndex * size + 1;
  const end = Math.min(totalPages, start + size - 1);
  const pages: number[] = [];
  for (let p = start; p <= end; p += 1) pages.push(p);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  windowSize = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = visiblePageWindow(page, totalPages, windowSize);
  const windowStart = pages[0] ?? 1;
  const windowEnd = pages[pages.length - 1] ?? 1;

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
      aria-label="Pagination"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex size-10 items-center justify-center rounded-2xl border border-[#E8E6F2] bg-white text-[#5B6178] transition hover:border-[#C9C3F5] hover:text-[#1B1F3B] disabled:pointer-events-none disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      {windowStart > 1 ? (
        <span className="px-1 text-xs font-medium text-[#9AA0B5]" aria-hidden>
          …
        </span>
      ) : null}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-2xl text-sm font-semibold transition",
            p === page
              ? "bg-[#6B5CF6] text-white shadow-[0_8px_20px_rgba(107,92,246,0.3)]"
              : "border border-[#E8E6F2] bg-white text-[#5B6178] hover:border-[#C9C3F5] hover:text-[#1B1F3B]",
          )}
        >
          {p}
        </button>
      ))}

      {windowEnd < totalPages ? (
        <span className="px-1 text-xs font-medium text-[#9AA0B5]" aria-hidden>
          …
        </span>
      ) : null}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex size-10 items-center justify-center rounded-2xl border border-[#E8E6F2] bg-white text-[#5B6178] transition hover:border-[#C9C3F5] hover:text-[#1B1F3B] disabled:pointer-events-none disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
