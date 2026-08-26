"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { SpaSampleSwitcher } from "./spa-sample-switcher";

const HERO =
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=2400&q=80";
const BOOK = "/booking";

/**
 * Sample 2 — Still
 * Light, modern, airy. Cool stone palette — brand as the hero signal.
 */
export function SpaSampleStill({
  sampleBasePath = "/rand",
}: {
  sampleBasePath?: "/rand" | "/landing/spa-samples";
} = {}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "spa-still min-h-svh bg-[#E8EBE7] text-[#1C211E]",
        "font-[family-name:var(--font-spa-still-body)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes still-rise {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes still-reveal {
          from {
            clip-path: inset(8% 4% 8% 4%);
            transform: scale(1.04);
          }
          to {
            clip-path: inset(0 0 0 0);
            transform: scale(1);
          }
        }
        .spa-still [data-rise] {
          opacity: 0;
        }
        .spa-still[data-ready="true"] [data-rise] {
          animation: still-rise 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .spa-still[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.05s;
        }
        .spa-still[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.16s;
        }
        .spa-still[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.28s;
        }
        .spa-still[data-ready="true"] [data-rise="4"] {
          animation-delay: 0.4s;
        }
        .spa-still[data-ready="true"] [data-reveal] {
          animation: still-reveal 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <section className="relative isolate flex min-h-svh flex-col">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={HERO}
            alt="Hands receiving a calm massage"
            fill
            priority
            sizes="100vw"
            data-reveal
            className="object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#E8EBE7]/55 via-[#E8EBE7]/20 to-[#E8EBE7]/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#E8EBE7]/50 via-transparent to-transparent" />
        </div>

        <header className="flex items-center justify-between px-5 pt-7 sm:px-10 sm:pt-9">
          <span
            data-rise="1"
            className="text-[11px] uppercase tracking-[0.24em] text-[#1C211E]/45"
          >
            Brisbane
          </span>
          <nav
            data-rise="1"
            className="flex gap-7 text-[12px] text-[#1C211E]/60"
          >
            <a href="#services" className="transition hover:text-[#1C211E]">
              Services
            </a>
            <Link href={BOOK} className="transition hover:text-[#1C211E]">
              Book
            </Link>
          </nav>
        </header>

        <div className="flex flex-1 flex-col justify-end px-5 pb-16 pt-28 sm:px-10 sm:pb-20 lg:max-w-3xl">
          <p
            data-rise="2"
            className="font-[family-name:var(--font-spa-still-display)] text-[clamp(3rem,9vw,6.25rem)] leading-[0.92] tracking-[-0.03em] text-[#1C211E]"
          >
            Everwell
            <br />
            Massage
          </p>
          <h1
            data-rise="3"
            className="mt-7 max-w-md text-lg leading-snug text-[#1C211E]/70 sm:text-xl"
          >
            Slow down. Recharge. Leave lighter than you arrived.
          </h1>
          <div data-rise="4" className="mt-9 flex flex-wrap gap-3">
            <Link
              href={BOOK}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#1C211E] px-8 text-sm font-medium text-[#E8EBE7] transition hover:bg-[#2A322E]"
            >
              Book a session
            </Link>
            <a
              href="#services"
              className="inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-medium text-[#1C211E]/65 transition hover:text-[#1C211E]"
            >
              View treatments
            </a>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="bg-[#F4F6F3] px-5 py-24 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-spa-still-display)] text-3xl tracking-tight sm:text-4xl">
            Popular treatments
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#1C211E]/55">
            Transparent pricing. Choose the time that fits your day.
          </p>
          <div className="mt-14 space-y-0 border-t border-[#1C211E]/10">
            {[
              {
                name: "Full body massage",
                times: "20–90 min",
                from: "from $50",
              },
              {
                name: "4 hands massage",
                times: "20–60 min",
                from: "from $90",
              },
              {
                name: "Hot stone · Cupping · Scrub",
                times: "Add-on rituals",
                from: "Ask us",
              },
            ].map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-[#1C211E]/10 py-6 sm:grid-cols-[1.4fr_1fr_auto]"
              >
                <p className="text-base font-medium sm:text-lg">{row.name}</p>
                <p className="hidden text-sm text-[#1C211E]/45 sm:block">
                  {row.times}
                </p>
                <p className="text-sm text-[#1C211E]/65">{row.from}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1C211E] px-5 py-20 text-[#E8EBE7] sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-spa-still-display)] text-2xl sm:text-3xl">
              Ready when you are
            </p>
            <p className="mt-2 text-sm text-[#E8EBE7]/55">
              1/120 Mary St · Open late every day
            </p>
          </div>
          <Link
            href={BOOK}
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#E8EBE7] px-8 text-sm font-medium text-[#1C211E] transition hover:bg-white"
          >
            Make an appointment
          </Link>
        </div>
      </section>

      <footer className="bg-[#F4F6F3] px-5 py-8 text-xs text-[#1C211E]/40 sm:px-10">
        <div className="mx-auto flex max-w-5xl justify-between gap-3">
          <span>Everwell Massage</span>
          <span>Ever /rand · Still</span>
        </div>
      </footer>

      <SpaSampleSwitcher active={2} tone="light" basePath={sampleBasePath} />
    </div>
  );
}
