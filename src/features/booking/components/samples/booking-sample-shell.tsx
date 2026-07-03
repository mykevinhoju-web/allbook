"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

const TOTAL_SAMPLES = 6;

interface BookingSampleShellProps {
  sampleLabel: string;
  sampleNumber: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  theme?: "light" | "dark" | "pink";
  totalSamples?: number;
}

export function BookingSampleShell({
  sampleLabel,
  sampleNumber,
  title,
  subtitle,
  children,
  className,
  theme = "light",
  totalSamples = TOTAL_SAMPLES,
}: BookingSampleShellProps) {
  const isDark = theme === "dark";
  const isPink = theme === "pink";

  return (
    <div
      className={cn(
        "min-h-svh",
        isDark
          ? "bg-black"
          : isPink
            ? "bg-gradient-to-b from-rose-50 via-white to-pink-50/60"
            : "bg-muted/30",
      )}
    >
      <div
        className={cn(
          "mx-auto min-h-svh max-w-md shadow-xl md:border-x",
          isDark
            ? "border-stone-800/60 bg-[#0a0909] text-stone-100"
            : isPink
              ? "border-rose-100/80 bg-white text-stone-800"
              : "border-border/60 bg-background",
        )}
      >
        <header
          className={cn(
            "sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md",
            isDark
              ? "border-stone-800/80 bg-[#0a0909]/95"
              : isPink
                ? "border-rose-100 bg-white/90"
                : "border-border/60 bg-background/95",
          )}
        >
          <div className="flex items-center gap-2">
            <Link
              href="/booking/samples"
              className={cn(
                "flex size-9 items-center justify-center rounded-full transition-colors",
                isDark
                  ? "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
                  : isPink
                    ? "text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-label="Back to samples"
            >
              <ChevronLeft className="size-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-widest",
                  isDark
                    ? "text-rose-300/70"
                    : isPink
                      ? "text-rose-400"
                      : "text-primary",
                )}
              >
                {sampleLabel}
              </p>
              <h1 className="truncate text-base font-semibold tracking-tight">
                {title}
              </h1>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                isDark
                  ? "bg-stone-900 text-stone-400 ring-1 ring-stone-800"
                  : isPink
                    ? "bg-rose-50 text-rose-500 ring-1 ring-rose-100"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {sampleNumber}/{totalSamples}
            </span>
          </div>
          {subtitle ? (
            <p
              className={cn(
                "mt-2 pl-11 text-sm",
                isDark
                  ? "text-stone-400"
                  : isPink
                    ? "text-rose-400/70"
                    : "text-muted-foreground",
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </header>

        <div className={cn("px-4 pb-8 pt-4", className)}>{children}</div>

        <footer
          className={cn(
            "sticky bottom-0 border-t px-4 py-3 backdrop-blur-md",
            isDark
              ? "border-stone-800/80 bg-[#0a0909]/95"
              : isPink
                ? "border-rose-100 bg-white/90"
                : "border-border/60 bg-background/95",
          )}
        >
          <div className="flex gap-2">
            {sampleNumber > 1 ? (
              <Link
                href={`/booking/samples/${sampleNumber - 1}`}
                className={cn(
                  "flex-1 rounded-xl border py-2.5 text-center text-sm font-medium",
                  isDark
                    ? "border-stone-700 text-stone-300"
                    : isPink
                      ? "border-rose-200 text-rose-600"
                      : "border-border",
                )}
              >
                Previous
              </Link>
            ) : (
              <span className="flex-1" />
            )}
            {sampleNumber < totalSamples ? (
              <Link
                href={`/booking/samples/${sampleNumber + 1}`}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-center text-sm font-medium",
                  isDark
                    ? "bg-gradient-to-r from-rose-900 to-amber-900 text-rose-50"
                    : isPink
                      ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-sm shadow-rose-200/50"
                      : "bg-primary text-primary-foreground",
                )}
              >
                Next sample
              </Link>
            ) : (
              <Link
                href="/booking/samples"
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-center text-sm font-medium",
                  isDark
                    ? "bg-gradient-to-r from-rose-900 to-amber-900 text-rose-50"
                    : isPink
                      ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-sm shadow-rose-200/50"
                      : "bg-primary text-primary-foreground",
                )}
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
