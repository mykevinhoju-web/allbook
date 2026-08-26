import Link from "next/link";
import type { Metadata } from "next";

import { requireEverTenant } from "@/features/spa-landing/server/require-ever-tenant";

export const metadata: Metadata = {
  title: "Ever landing WIP",
  robots: { index: false, follow: false },
};

export default async function EverRandIndexPage() {
  await requireEverTenant();

  return (
    <main className="min-h-svh bg-[#0C0D0C] px-5 py-16 text-[#F2EFE8] sm:px-10">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#D4B87A]/80">
            Ever · /rand
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Landing page WIP
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[#F2EFE8]/55">
            Design work happens here. When a direction is ready, we promote it
            to the site index. The live home stays under construction until
            then.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/rand/1"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#D4B87A]/40"
          >
            <p className="text-[11px] uppercase tracking-wider text-[#D4B87A]">
              1 · Nocturne
            </p>
            <p className="mt-3 text-lg font-medium">Dark luxury</p>
          </Link>
          <Link
            href="/rand/2"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#A8B5A4]/50"
          >
            <p className="text-[11px] uppercase tracking-wider text-[#A8B5A4]">
              2 · Still
            </p>
            <p className="mt-3 text-lg font-medium">Light &amp; airy</p>
          </Link>
          <Link
            href="/rand/3"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#C4A862]/40"
          >
            <p className="text-[11px] uppercase tracking-wider text-[#C4A862]">
              3 · Verdant
            </p>
            <p className="mt-3 text-lg font-medium">Forest calm</p>
          </Link>
        </div>

        <p className="text-sm text-[#F2EFE8]/35">
          Public home:{" "}
          <Link href="/" className="underline-offset-2 hover:underline">
            Under construction
          </Link>
        </p>
      </div>
    </main>
  );
}
