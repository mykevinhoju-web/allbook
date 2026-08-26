import Link from "next/link";
import type { Metadata } from "next";

import { EverLogo } from "@/features/ever";
import { requireEverTenant } from "@/features/ever/server/require-ever-tenant";

export const metadata: Metadata = {
  title: "Ever landing samples",
  robots: { index: false, follow: false },
};

export default async function EverRandIndexPage() {
  await requireEverTenant();

  return (
    <main className="min-h-svh bg-black px-5 py-16 text-[#E9EDE8] sm:px-10">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-6">
          <EverLogo href="/" width={200} />
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#C4A862]/85">
              everwellmassage.com.au/rand
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Landing samples
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#E9EDE8]/55">
              Compare three directions on the Ever domain.{" "}
              <strong className="font-medium text-[#C4A862]">Verdant</strong>{" "}
              is the selected direction — we refine it before promoting to the
              home page.
            </p>
          </div>
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
            className="rounded-2xl border border-[#C4A862]/50 bg-[#C4A862]/10 p-6 ring-1 ring-[#C4A862]/30 transition hover:border-[#C4A862]"
          >
            <p className="text-[11px] uppercase tracking-wider text-[#C4A862]">
              3 · Verdant · Selected
            </p>
            <p className="mt-3 text-lg font-medium">Forest calm</p>
          </Link>
        </div>

        <p className="text-sm text-[#E9EDE8]/35">
          Live home:{" "}
          <Link href="/" className="text-[#C4A862]/80 underline-offset-2 hover:underline">
            Under construction
          </Link>
        </p>
      </div>
    </main>
  );
}
