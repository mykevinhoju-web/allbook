import Link from "next/link";

import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";

export default function LandingSamplesIndexPage() {
  return (
    <main className="min-h-svh bg-stone-950 px-5 py-16 text-stone-100 sm:px-10">
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="space-y-3">
          <AllBookLogo size="md" variant="white" />
          <p className="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Landing samples
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Book. Get Paid. Grow.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-stone-400">
            Five direction samples for the platform homepage. Pick a tone — we
            can refine the winner next.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/landing/samples/1"
            className="group rounded-2xl border border-stone-800 bg-stone-900/80 p-6 transition hover:border-stone-600 hover:bg-stone-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-500/80">
              Sample 1 · Ink
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Dark premium hero with full-bleed spa photo.
            </p>
          </Link>

          <Link
            href="/landing/samples/2"
            className="group rounded-2xl border border-stone-800 bg-stone-900/80 p-6 transition hover:border-stone-600 hover:bg-stone-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">
              Sample 2 · Grove
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Light wellness, centered slogan.
            </p>
          </Link>

          <Link
            href="/landing/samples/3"
            className="group rounded-2xl border border-stone-800 bg-stone-900/80 p-6 transition hover:border-stone-600 hover:bg-stone-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-400/90">
              Sample 3 · Pulse
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Purple SaaS layout with phone mockup.
            </p>
          </Link>

          <Link
            href="/landing/samples/4"
            className="group rounded-2xl border border-stone-800 bg-stone-900/80 p-6 transition hover:border-stone-600 hover:bg-stone-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C4A484]">
              Sample 4 · Linen
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Soft beige SaaS — booking card + plant, no phone.
            </p>
          </Link>

          <Link
            href="/landing/samples/5"
            className="group rounded-2xl border border-stone-800 bg-stone-900/80 p-6 transition hover:border-stone-600 hover:bg-stone-900 sm:col-span-2"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
              Sample 5 · Vista
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Premium split hero — CTA card + photo with phone overlay. AllBook
              blue branding.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
