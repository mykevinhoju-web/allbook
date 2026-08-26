"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { EverLandingSwitcher } from "../landing-switcher";

const HERO =
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=80";
const BOOK = "/booking";

/**
 * Sample 1 — Nocturne
 * Dark, quiet luxury. Brand-first full-bleed hero with champagne accents.
 */
export function EverLandingNocturne() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "spa-nocturne min-h-svh bg-[#0C0D0C] text-[#F2EFE8]",
        "font-[family-name:var(--font-ever-nocturne-body)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes spa-rise {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spa-ken {
          from {
            transform: scale(1.08);
          }
          to {
            transform: scale(1);
          }
        }
        .spa-nocturne [data-rise] {
          opacity: 0;
        }
        .spa-nocturne[data-ready="true"] [data-rise] {
          animation: spa-rise 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .spa-nocturne[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.06s;
        }
        .spa-nocturne[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.18s;
        }
        .spa-nocturne[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.32s;
        }
        .spa-nocturne[data-ready="true"] [data-rise="4"] {
          animation-delay: 0.46s;
        }
        .spa-nocturne[data-ready="true"] [data-ken] {
          animation: spa-ken 10s ease-out forwards;
        }
      `}</style>

      <section className="relative isolate flex min-h-svh flex-col">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={HERO}
            alt="Quiet spa treatment room"
            fill
            priority
            sizes="100vw"
            data-ken
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#0C0D0C]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0D0C] via-[#0C0D0C]/35 to-[#0C0D0C]/45" />
        </div>

        <header className="flex items-center justify-between px-5 pt-7 sm:px-10 sm:pt-9">
          <nav
            data-rise="1"
            className="flex gap-6 text-[11px] uppercase tracking-[0.22em] text-[#F2EFE8]/55"
          >
            <a href="#services" className="transition hover:text-[#F2EFE8]">
              Services
            </a>
            <a href="#visit" className="transition hover:text-[#F2EFE8]">
              Visit
            </a>
          </nav>
          <Link
            href={BOOK}
            data-rise="1"
            className="text-[11px] uppercase tracking-[0.22em] text-[#D4B87A] transition hover:text-[#E4C98A]"
          >
            Book
          </Link>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-5 pb-20 pt-16 text-center sm:px-10">
          <p
            data-rise="2"
            className="font-[family-name:var(--font-ever-nocturne-display)] text-[clamp(3.25rem,11vw,7.5rem)] leading-[0.9] tracking-[-0.02em] text-[#F2EFE8]"
          >
            Everwell Massage
          </p>
          <h1
            data-rise="3"
            className="mt-6 max-w-md text-sm font-normal uppercase tracking-[0.28em] text-[#F2EFE8]/70 sm:text-[15px]"
          >
            Your escape to total relaxation
          </h1>
          <p
            data-rise="3"
            className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#F2EFE8]/55"
          >
            Deep relief, glowing skin, or a quiet hour away — made golden.
          </p>
          <div data-rise="4" className="mt-10">
            <Link
              href={BOOK}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#D4B87A] px-9 text-[13px] font-medium tracking-wide text-[#1A150C] transition hover:bg-[#E0C48A]"
            >
              Make an appointment
            </Link>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="border-t border-white/10 px-5 py-24 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4B87A]/80">
            Treatments
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-ever-nocturne-display)] text-3xl tracking-tight sm:text-4xl">
            Care for body and mind
          </h2>
          <ul className="mt-14 grid gap-0 border-t border-white/10 sm:grid-cols-2">
            {[
              "Deep tissue massage",
              "Relaxing massage",
              "Thai massage",
              "Hot stone",
              "Aromatherapy",
              "Body scrub",
            ].map((name) => (
              <li
                key={name}
                className="border-b border-white/10 py-5 text-[15px] text-[#F2EFE8]/75 sm:pr-8"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="visit" className="border-t border-white/10 px-5 py-20 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#F2EFE8]/40">
              Brisbane CBD
            </p>
            <p className="mt-3 font-[family-name:var(--font-ever-nocturne-display)] text-2xl">
              1/120 Mary Street
            </p>
            <p className="mt-2 text-sm text-[#F2EFE8]/50">
              Mon–Sun · 9 AM – Late
            </p>
          </div>
          <Link
            href={BOOK}
            className="inline-flex h-11 items-center text-[13px] uppercase tracking-[0.2em] text-[#D4B87A] transition hover:text-[#E4C98A]"
          >
            Book now →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-xs text-[#F2EFE8]/35 sm:px-10">
        <div className="mx-auto flex max-w-5xl justify-between gap-3">
          <span>Everwell Massage</span>
          <span>Ever /rand · Nocturne</span>
        </div>
      </footer>

      <EverLandingSwitcher active={1} tone="dark" />
    </div>
  );
}
