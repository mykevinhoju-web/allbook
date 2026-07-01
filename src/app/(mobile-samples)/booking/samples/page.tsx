import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Booking Samples",
  robots: { index: false, follow: false },
};

const samples = [
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
          {samples.map((sample) => (
            <Link
              key={sample.number}
              href={`/booking/samples/${sample.number}`}
              className="block rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-colors active:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {sample.style}
                  </p>
                  <h2 className="font-semibold">{sample.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {sample.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Best viewed on mobile. Open{" "}
          <span className="font-medium text-foreground">Admin → Turn on alerts</span>{" "}
          on a phone/tablet, then tap Book here to test sound.
        </p>
      </div>
    </div>
  );
}
