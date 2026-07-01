"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface BookingSampleShellProps {
  sampleLabel: string;
  sampleNumber: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function BookingSampleShell({
  sampleLabel,
  sampleNumber,
  title,
  subtitle,
  children,
  className,
}: BookingSampleShellProps) {
  return (
    <div className="min-h-svh bg-muted/30">
      <div className="mx-auto min-h-svh max-w-md bg-background shadow-xl md:border-x md:border-border/60">
        <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Link
              href="/booking/samples"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Back to samples"
            >
              <ChevronLeft className="size-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                {sampleLabel}
              </p>
              <h1 className="truncate text-base font-semibold tracking-tight">
                {title}
              </h1>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {sampleNumber}/3
            </span>
          </div>
          {subtitle ? (
            <p className="mt-2 pl-11 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </header>

        <div className={cn("px-4 pb-8 pt-4", className)}>{children}</div>

        <footer className="sticky bottom-0 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md">
          <div className="flex gap-2">
            {sampleNumber > 1 ? (
              <Link
                href={`/booking/samples/${sampleNumber - 1}`}
                className="flex-1 rounded-xl border border-border py-2.5 text-center text-sm font-medium"
              >
                Previous
              </Link>
            ) : (
              <span className="flex-1" />
            )}
            {sampleNumber < 3 ? (
              <Link
                href={`/booking/samples/${sampleNumber + 1}`}
                className="flex-1 rounded-xl bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                Next sample
              </Link>
            ) : (
              <Link
                href="/booking/samples"
                className="flex-1 rounded-xl bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                All samples
              </Link>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
