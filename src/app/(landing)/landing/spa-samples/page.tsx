import Link from "next/link";

export default function SpaSamplesIndexPage() {
  return (
    <main className="min-h-svh bg-[#0C0D0C] px-5 py-16 text-[#F2EFE8] sm:px-10">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#D4B87A]/80">
            Time Massage Day Spa
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Homepage design samples
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[#F2EFE8]/55">
            Three modern, simple directions with a quiet luxurious feel. Pick a
            tone — we refine the winner next.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/landing/spa-samples/1"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#D4B87A]/40 hover:bg-white/[0.05]"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#D4B87A]">
              1 · Nocturne
            </p>
            <p className="mt-3 text-lg font-medium">Dark luxury</p>
            <p className="mt-2 text-sm leading-relaxed text-[#F2EFE8]/50">
              Full-bleed spa photo, centered brand, champagne accents.
            </p>
          </Link>

          <Link
            href="/landing/spa-samples/2"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#A8B5A4]/50 hover:bg-white/[0.05]"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#A8B5A4]">
              2 · Still
            </p>
            <p className="mt-3 text-lg font-medium">Light &amp; airy</p>
            <p className="mt-2 text-sm leading-relaxed text-[#F2EFE8]/50">
              Cool stone palette, modern type, clean treatment list.
            </p>
          </Link>

          <Link
            href="/landing/spa-samples/3"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#C4A862]/40 hover:bg-white/[0.05]"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#C4A862]">
              3 · Verdant
            </p>
            <p className="mt-3 text-lg font-medium">Forest calm</p>
            <p className="mt-2 text-sm leading-relaxed text-[#F2EFE8]/50">
              Deep green night mood, soft gold light, quiet luxury copy.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
