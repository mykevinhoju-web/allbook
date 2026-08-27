"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { EverLogo } from "../ever-logo";
import { EVER_BRAND } from "../../theme";
import { EverLandingSwitcher } from "../landing-switcher";

const HERO =
  "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=2400&q=80";
const BOOK = "/booking";

/**
 * Sample 3 — Verdant
 * Deep forest calm with soft gold light — modern spa, quietly gorgeous.
 */
export function EverLandingVerdant() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "spa-verdant min-h-svh bg-[#121814] text-[#E9EDE8]",
        "font-[family-name:var(--font-ever-verdant-body)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes verd-fade {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes verd-glow {
          from {
            opacity: 0.35;
          }
          to {
            opacity: 0.7;
          }
        }
        @keyframes verd-drift {
          from {
            transform: scale(1.05) translateY(1%);
          }
          to {
            transform: scale(1) translateY(0);
          }
        }
        .spa-verdant [data-rise] {
          opacity: 0;
        }
        .spa-verdant[data-ready="true"] [data-rise] {
          animation: verd-fade 0.95s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .spa-verdant[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.08s;
        }
        .spa-verdant[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.2s;
        }
        .spa-verdant[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.34s;
        }
        .spa-verdant[data-ready="true"] [data-rise="4"] {
          animation-delay: 0.48s;
        }
        .spa-verdant[data-ready="true"] [data-drift] {
          animation: verd-drift 11s ease-out forwards;
        }
        .spa-verdant[data-ready="true"] [data-glow] {
          animation: verd-glow 2.4s ease-out forwards;
        }
      `}</style>

      <section className="relative isolate flex min-h-svh flex-col overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={HERO}
            alt="Spa oils and calm treatment setting"
            fill
            priority
            sizes="100vw"
            data-drift
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#121814]/70" />
          <div
            data-glow
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(196,168,98,0.18),transparent_55%)]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121814] via-transparent to-[#121814]/50" />
        </div>

        <header className="flex items-center justify-between gap-4 px-5 pt-7 sm:px-10 sm:pt-9">
          <div data-rise="1">
            <EverLogo href="/" width={168} priority />
          </div>
          <Link
            href={BOOK}
            data-rise="1"
            className="inline-flex h-10 items-center rounded-full border px-5 text-[12px] tracking-wide transition hover:bg-[#C4A862]/10"
            style={{
              borderColor: `${EVER_BRAND.gold}73`,
              color: EVER_BRAND.text,
            }}
          >
            Book
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-center px-5 pb-24 pt-20 sm:px-10 lg:max-w-2xl">
          <p
            data-rise="2"
            className="font-[family-name:var(--font-ever-verdant-display)] text-[clamp(2.75rem,7.5vw,5.25rem)] leading-[1.02] tracking-[-0.02em]"
          >
            A quieter kind of luxury
          </p>
          <h1
            data-rise="3"
            className="mt-6 max-w-md text-base leading-relaxed text-[#E9EDE8]/65 sm:text-lg"
          >
            Personalized massage in Brisbane CBD — where health, peace, and
            comfort come first.
          </h1>
          <div data-rise="4" className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href={BOOK}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#C4A862] px-8 text-sm font-medium text-[#16140C] transition hover:bg-[#D2B872]"
            >
              Reserve your time
            </Link>
            <a
              href="#why"
              className="text-sm text-[#E9EDE8]/50 underline-offset-4 transition hover:text-[#E9EDE8] hover:underline"
            >
              Why guests return
            </a>
          </div>
        </div>
      </section>

      <section
        id="why"
        className="border-t border-white/8 px-5 py-24 sm:px-10"
      >
        <div className="mx-auto grid max-w-5xl gap-16 md:grid-cols-3 md:gap-10">
          {[
            {
              title: "Tailored touch",
              copy: "Every session is shaped around what your body needs that day — tension, balance, or pure rest.",
            },
            {
              title: "Skilled hands",
              copy: "Modern technique meets traditional practice for a treatment that feels precise and calm.",
            },
            {
              title: "Still space",
              copy: "Soft light, quiet rooms, and an atmosphere built for slowing the clock.",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-3">
              <h2 className="font-[family-name:var(--font-ever-verdant-display)] text-2xl text-[#C4A862]">
                {item.title}
              </h2>
              <p className="text-sm leading-relaxed text-[#E9EDE8]/55 sm:text-[15px]">
                {item.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/8 px-5 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-[family-name:var(--font-ever-verdant-display)] text-3xl sm:text-4xl">
            Make your time golden
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm text-[#E9EDE8]/50">
            1/120 Mary Street, Brisbane · Mon–Sun 9 AM – Late
          </p>
          <Link
            href={BOOK}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full border border-[#C4A862]/50 px-9 text-sm text-[#E9EDE8] transition hover:border-[#C4A862] hover:bg-[#C4A862]/10"
          >
            Make an appointment
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-8 text-xs text-[#E9EDE8]/30 sm:px-10">
        <div className="mx-auto flex max-w-5xl justify-between gap-3">
          <span>Everwell Massage &amp; Wellness</span>
          <span>Selected · Verdant</span>
        </div>
      </footer>

      <EverLandingSwitcher active={3} tone="dark" />
    </div>
  );
}
