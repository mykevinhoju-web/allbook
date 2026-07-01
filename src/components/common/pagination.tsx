"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

import { AppButton } from "./app-button";

interface PaginationProps extends React.ComponentProps<"nav"> {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
) {
  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPageNumbers >= totalPages) {
    return range(1, totalPages);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = range(1, 3 + siblingCount * 2);
    return [...leftRange, "ellipsis", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = range(totalPages - (2 + siblingCount * 2), totalPages);
    return [1, "ellipsis", ...rightRange];
  }

  return [
    1,
    "ellipsis",
    ...range(leftSibling, rightSibling),
    "ellipsis",
    totalPages,
  ];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
  ...props
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPaginationRange(currentPage, totalPages, siblingCount);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <AppButton
        variant="outline"
        size="icon"
        aria-label="Previous page"
        disabled={currentPage <= 1}
        onClick={() => onPageChange?.(currentPage - 1)}
      >
        <ChevronLeft className="size-4" />
      </AppButton>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex size-10 items-center justify-center text-muted-foreground"
            aria-hidden="true"
          >
            <MoreHorizontal className="size-4" />
          </span>
        ) : (
          <AppButton
            key={page}
            variant={page === currentPage ? "primary" : "ghost"}
            size="icon"
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange?.(page as number)}
          >
            {page}
          </AppButton>
        ),
      )}

      <AppButton
        variant="outline"
        size="icon"
        aria-label="Next page"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
      >
        <ChevronRight className="size-4" />
      </AppButton>
    </nav>
  );
}
