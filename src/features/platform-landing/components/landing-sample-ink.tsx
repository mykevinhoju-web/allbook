"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { AllBookLogo } from "./allbook-logo";
import { LandingSampleSwitcher } from "./landing-sample-switcher";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=80";

/**
 * Sample 1 — Ink
 * Dark, confident B2B tone. Brand-first hero with slogan as the headline.
 */
export function LandingSampleInk() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "landing-ink min-h-svh bg-[#0B0C0B] text-[#F4F1EA]",
        "font-[family-name:var(--font-landing-ink-body)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes ink-rise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes ink-drift {
          from {
            transform: scale(1.06);
          }
          to {
            transform: scale(1);
          }
        }
        .landing-ink [data-rise] {
          opacity: 0;
        }
        .landing-ink[data-ready="true"] [data-rise] {
          animation: ink-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .landing-ink[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.08s;
        }
        .landing-ink[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.2s;
        }
        .landing-ink[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.34s;
        }
        .landing-ink[data-ready="true"] [data-rise="4"] {
          animation-delay: 0.48s;
        }
        .landing-ink[data-ready="true"] [data-drift] {
          animation: ink-drift 8s ease-out forwards;
        }
      `}</style>

      <div>
        <section className="relative isolate flex min-h-svh flex-col">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <Image
              src={HERO_IMAGE}
              alt="Calm spa treatment room"
              fill
              priority
              sizes="100vw"
              data-drift
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0B]/92 via-[#0B0C0B]/72 to-[#0B0C0B]/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0B] via-transparent to-[#0B0C0B]/40" />
          </div>

          <header className="flex items-center justify-between px-5 pt-6 sm:px-10 sm:pt-8">
            <Link href="/landing/samples/1" data-rise="1" className="inline-flex">
              <AllBookLogo size="md" variant="white" />
            </Link>
            <Link
              href="/platform"
              className="text-sm text-[#F4F1EA]/70 transition hover:text-[#F4F1EA]"
            >
              Sign in
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-end px-5 pb-16 pt-24 sm:px-10 sm:pb-20 lg:max-w-3xl">
            <h1
              data-rise="2"
              className="font-[family-name:var(--font-landing-ink-display)] text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] tracking-tight text-[#F4F1EA]"
            >
              Book.
              <br />
              Get Paid.
              <br />
              Grow.
            </h1>
            <p
              data-rise="3"
              className="mt-6 max-w-md text-base leading-relaxed text-[#F4F1EA]/75 sm:text-lg"
            >
              Booking software for wellness and beauty businesses — schedules,
              payments, and growth in one place.
            </p>
            <div data-rise="4" className="mt-8 flex flex-wrap gap-3">
              <Link
                href="https://dayspa.allbook.com.au/booking"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#C9A86A] px-7 text-sm font-semibold text-[#1A150C] transition hover:bg-[#D4B57A]"
              >
                See a live booking
              </Link>
              <Link
                href="/platform"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-7 text-sm font-semibold text-[#F4F1EA] transition hover:border-white/50 hover:bg-white/5"
              >
                Platform admin
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-5 py-20 sm:px-10">
          <div className="mx-auto grid max-w-5xl gap-14 md:grid-cols-3 md:gap-10">
            {[
              {
                title: "Book",
                copy: "Customers pick a therapist and time. Your team sees every booking the moment it lands.",
              },
              {
                title: "Get Paid",
                copy: "Take deposits and card payments at booking — less no-shows, clearer cash flow.",
              },
              {
                title: "Grow",
                copy: "Staff, rooms, and reports stay in sync so you can focus on filling the diary.",
              },
            ].map((item) => (
              <div key={item.title} className="space-y-3">
                <h2 className="font-[family-name:var(--font-landing-ink-display)] text-3xl text-[#C9A86A]">
                  {item.title}
                </h2>
                <p className="text-sm leading-relaxed text-[#F4F1EA]/65 sm:text-base">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 px-5 py-8 text-sm text-[#F4F1EA]/45 sm:px-10">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <span className="font-[family-name:var(--font-landing-ink-display)] text-[#F4F1EA]/70">
              AllBook
            </span>
            <span>Sample design · not final</span>
          </div>
        </footer>
      </div>

      <LandingSampleSwitcher active={1} tone="dark" />
    </div>
  );
}
