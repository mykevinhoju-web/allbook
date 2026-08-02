"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { AllBookLogo } from "./allbook-logo";
import { LandingSampleSwitcher } from "./landing-sample-switcher";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=2400&q=80";

/**
 * Sample 2 — Grove
 * Light, airy wellness tone. Brand-first hero with slogan as the headline.
 */
export function LandingSampleGrove() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "landing-grove min-h-svh bg-[#F3F5F2] text-[#16332E]",
        "font-[family-name:var(--font-landing-grove-body)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes grove-rise {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes grove-soft {
          from {
            opacity: 0.55;
            transform: scale(1.05);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .landing-grove [data-rise] {
          opacity: 0;
        }
        .landing-grove[data-ready="true"] [data-rise] {
          animation: grove-rise 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .landing-grove[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.05s;
        }
        .landing-grove[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.18s;
        }
        .landing-grove[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.3s;
        }
        .landing-grove[data-ready="true"] [data-rise="4"] {
          animation-delay: 0.42s;
        }
        .landing-grove[data-ready="true"] [data-soft] {
          animation: grove-soft 7s ease-out forwards;
        }
      `}</style>

      <div>
        <section className="relative isolate min-h-svh overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src={HERO_IMAGE}
              alt="Bright spa massage room with natural light"
              fill
              priority
              sizes="100vw"
              data-soft
              className="object-cover object-[center_30%]"
            />
            <div className="absolute inset-0 bg-[#F3F5F2]/55" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#F3F5F2]/90 via-[#F3F5F2]/35 to-[#F3F5F2]/85" />
          </div>

          <header className="flex items-center justify-between px-5 pt-6 sm:px-10 sm:pt-8">
            <Link href="/landing/samples/2" data-rise="1" className="inline-flex">
              <AllBookLogo size="md" variant="blue" />
            </Link>
            <Link
              href="/platform"
              className="text-sm font-medium text-[#16332E]/65 transition hover:text-[#16332E]"
            >
              Sign in
            </Link>
          </header>

          <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-4xl flex-col items-center justify-center px-5 pb-20 pt-10 text-center sm:px-10">
            <h1
              data-rise="2"
              className="font-[family-name:var(--font-landing-grove-display)] text-[clamp(2.6rem,7.5vw,5rem)] font-semibold leading-[1.02] tracking-tight text-[#16332E]"
            >
              Book. Get Paid. Grow.
            </h1>
            <p
              data-rise="3"
              className="mt-6 max-w-lg text-base leading-relaxed text-[#16332E]/75 sm:text-lg"
            >
              The simple booking platform for day spas and beauty studios that
              want more confirmed appointments — and fewer unpaid gaps.
            </p>
            <div
              data-rise="4"
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <Link
                href="https://dayspa.allbook.com.au/booking"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#16332E] px-7 text-sm font-semibold text-[#F3F5F2] transition hover:bg-[#1F463F]"
              >
                See a live booking
              </Link>
              <Link
                href="/platform"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#16332E]/25 bg-white/50 px-7 text-sm font-semibold text-[#16332E] backdrop-blur-sm transition hover:border-[#16332E]/45 hover:bg-white/80"
              >
                Platform admin
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#16332E] px-5 py-20 text-[#F3F5F2] sm:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="font-[family-name:var(--font-landing-grove-display)] text-sm font-semibold uppercase tracking-[0.2em] text-[#9BC4B8]">
              How it works
            </p>
            <div className="mt-10 grid gap-12 md:grid-cols-3 md:gap-8">
              {[
                {
                  step: "01",
                  title: "Book",
                  copy: "Guests book online in minutes. Staff and rooms stay aligned automatically.",
                },
                {
                  step: "02",
                  title: "Get Paid",
                  copy: "Secure card checkout at the time of booking keeps revenue ahead of the appointment.",
                },
                {
                  step: "03",
                  title: "Grow",
                  copy: "Clear schedules and reports help you fill quieter hours and scale the team.",
                },
              ].map((item) => (
                <div key={item.step} className="space-y-3">
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#9BC4B8]">
                    {item.step}
                  </p>
                  <h2 className="font-[family-name:var(--font-landing-grove-display)] text-3xl font-semibold">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#F3F5F2]/70 sm:text-base">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-[#16332E]/10 px-5 py-8 text-sm text-[#16332E]/50 sm:px-10">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <span className="font-[family-name:var(--font-landing-grove-display)] font-semibold text-[#16332E]/70">
              AllBook
            </span>
            <span>Sample design · not final</span>
          </div>
        </footer>
      </div>

      <LandingSampleSwitcher active={2} tone="light" />
    </div>
  );
}
