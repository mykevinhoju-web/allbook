import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Moon } from "lucide-react";

export const metadata: Metadata = {
  title: "Booking Samples",
  robots: { index: false, follow: false },
};

const lightSamples = [
  {
    number: 1,
    title: "Sample 1 — Clean List",
    description: "Compact rows with photo, name, and pill Book button.",
    style: "Apple-style list",
  },
  {
    number: 2,
    title: "Sample 2 — Card Stack",
    description: "Larger photo cards with full-width Book CTA.",
    style: "Spa card layout",
  },
  {
    number: 3,
    title: "Sample 3 — Portrait Focus",
    description: "Bigger portraits with outlined Book button.",
    style: "Bold photo-first",
  },
] as const;

const darkSamples = [
  {
    number: 4,
    title: "Sample 4 — Noir Gallery",
    description: "Full-bleed portraits, rose-gold gradients, private reserve.",
    style: "Dark cinematic",
  },
  {
    number: 5,
    title: "Sample 5 — Velvet Lounge",
    description: "Moody rows with soft glow borders and after-hours copy.",
    style: "Erotic boutique",
  },
] as const;

function SampleLink({
  sample,
  dark = false,
}: {
  sample: (typeof lightSamples)[number] | (typeof darkSamples)[number];
  dark?: boolean;
}) {
  return (
    <Link
      href={`/booking/samples/${sample.number}`}
      className={
        dark
          ? "block rounded-2xl border border-rose-900/30 bg-gradient-to-br from-stone-900 to-stone-950 p-4 shadow-[0_0_32px_-12px_rgba(190,24,93,0.35)] transition-colors active:bg-stone-900"
          : "block rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-colors active:bg-muted/30"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p
            className={
              dark
                ? "text-xs font-medium text-rose-300/60"
                : "text-xs font-medium text-muted-foreground"
            }
          >
            {sample.style}
          </p>
          <h2 className={dark ? "font-semibold text-stone-100" : "font-semibold"}>
            {sample.title}
          </h2>
          <p
            className={
              dark ? "text-sm text-stone-400" : "text-sm text-muted-foreground"
            }
          >
            {sample.description}
          </p>
        </div>
        <ArrowRight
          className={
            dark
              ? "mt-1 size-4 shrink-0 text-rose-400/50"
              : "mt-1 size-4 shrink-0 text-muted-foreground"
          }
        />
      </div>
    </Link>
  );
}

export default function BookingSamplesIndexPage() {
  return (
    <div className="min-h-svh bg-muted/30">
      <div className="mx-auto min-h-svh max-w-md bg-background px-4 py-6 shadow-xl md:border-x md:border-border/60">
        <div className="space-y-2 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Design preview
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Booking main screen</h1>
          <p className="text-sm text-muted-foreground">
            Mobile-optimized staff picker mockups. Tap a sample to preview.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Light & clean
          </p>
          {lightSamples.map((sample) => (
            <SampleLink key={sample.number} sample={sample} />
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="size-4 text-rose-400/70" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dark & moody
            </p>
          </div>
          {darkSamples.map((sample) => (
            <SampleLink key={sample.number} sample={sample} dark />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Best viewed on mobile. Open{" "}
          <span className="font-medium text-foreground">Admin → Turn on alerts</span>{" "}
          on a phone/tablet, then tap Reserve here to test sound.
        </p>
      </div>
    </div>
  );
}
