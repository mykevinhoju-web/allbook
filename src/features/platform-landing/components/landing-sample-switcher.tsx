import Link from "next/link";

import { cn } from "@/lib/utils";

const SAMPLES = [
  { href: "/landing/samples/1", name: "Ink" },
  { href: "/landing/samples/2", name: "Grove" },
  { href: "/landing/samples/3", name: "Pulse" },
  { href: "/landing/samples/4", name: "Linen" },
  { href: "/landing/samples/5", name: "Vista" },
] as const;

export function LandingSampleSwitcher({
  active,
  tone = "light",
}: {
  active: 1 | 2 | 3 | 4 | 5;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "fixed right-3 bottom-3 z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-x-auto rounded-full p-1 text-xs shadow-lg backdrop-blur-md sm:right-5 sm:bottom-5",
        tone === "dark"
          ? "bg-white/10 text-white ring-1 ring-white/20"
          : "bg-stone-900/90 text-white ring-1 ring-white/10",
      )}
    >
      <span className="hidden px-2 text-[10px] uppercase tracking-wider opacity-70 sm:inline">
        Samples
      </span>
      {SAMPLES.map((sample, index) => {
        const n = (index + 1) as 1 | 2 | 3 | 4 | 5;
        const isActive = active === n;
        return (
          <Link
            key={sample.href}
            href={sample.href}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 font-medium transition",
              isActive
                ? "bg-white text-stone-900"
                : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            {sample.name}
          </Link>
        );
      })}
      <Link
        href="/landing/samples"
        className="shrink-0 rounded-full px-2 py-1.5 text-white/60 hover:text-white"
      >
        All
      </Link>
    </div>
  );
}
