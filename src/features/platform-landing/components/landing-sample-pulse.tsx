"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  Scissors,
  Share2,
  Sparkles,
  Stethoscope,
  SprayCan,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { AllBookLogo } from "./allbook-logo";
import { LandingSampleSwitcher } from "./landing-sample-switcher";

const ACCENT = "#7C3AED";

/**
 * Sample 3 — Pulse
 * Clean SaaS marketing page based on the user-supplied AllBook mockup.
 * Use `mode="live"` on the platform apex (allbook.com.au) to hide sample chrome.
 */
export function LandingSamplePulse({
  mode = "sample",
}: {
  mode?: "sample" | "live";
}) {
  const [ready, setReady] = useState(false);
  const isLive = mode === "live";

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "landing-pulse min-h-svh bg-white text-neutral-900",
        "font-[family-name:var(--font-landing-pulse)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes pulse-rise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .landing-pulse [data-rise] {
          opacity: 0;
        }
        .landing-pulse[data-ready="true"] [data-rise] {
          animation: pulse-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .landing-pulse[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.04s;
        }
        .landing-pulse[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.12s;
        }
        .landing-pulse[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.22s;
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href={isLive ? "/" : "/landing/samples/3"} className="inline-flex">
            <AllBookLogo size="sm" variant="blue" />
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-neutral-500 lg:flex">
            {["Features", "Pricing", "Demo"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-neutral-900">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/platform"
              className="hidden text-sm font-medium text-neutral-600 hover:text-neutral-900 sm:inline"
            >
              Log in
            </Link>
            <Link
              href="/platform"
              className="inline-flex h-9 items-center rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — soft spa flat-lay atmosphere behind copy + phone */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            {/* Soft wash base */}
            <div className="absolute inset-0 bg-[#F4F0EA]" />
            {/* User flat-lay vibe, lightened */}
            <div
              className="absolute inset-0 scale-105 opacity-[0.28]"
              style={{
                backgroundImage: "url(/landing/spa-flatlay-ref.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(1.55) saturate(0.55) contrast(0.92)",
              }}
            />
            {/* Keep left readable, let texture peek on the right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F4F0EA] via-[#F4F0EA]/88 to-[#F4F0EA]/35" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#F4F0EA]/55 via-transparent to-white" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,rgba(255,255,255,0.35),transparent_55%)]" />
          </div>

          <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-24">
            <div className="max-w-xl">
              <h1
                data-rise="1"
                className="text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-neutral-950"
              >
                <span className="block">Book</span>
                <span className="block">Get Paid</span>
                <span className="block">Grow</span>
              </h1>
              <p
                data-rise="2"
                className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg"
              >
                Simple booking software for Australian service businesses.
              </p>

              <ul data-rise="2" className="mt-7 space-y-2.5">
                {["Easy to set up", "Take deposits", "Reduce no-shows"].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm text-neutral-700 sm:text-[15px]"
                    >
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <Check className="size-3 stroke-[3]" />
                      </span>
                      {item}
                    </li>
                  ),
                )}
              </ul>

              <div data-rise="3" className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/platform"
                  className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/booking"
                  className="inline-flex h-11 items-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400"
                >
                  View Demo
                </Link>
              </div>
              <p className="mt-4 text-xs text-neutral-500">
                No lock-in · Stripe ready · Cancel anytime
              </p>
            </div>

            <div
              data-rise="3"
              className="relative mx-auto flex w-full max-w-[260px] items-center justify-center sm:max-w-[280px] lg:ml-auto lg:mr-2 lg:max-w-[300px]"
            >
              <div className="absolute inset-x-4 inset-y-8 rounded-[2rem] bg-[#E8DFD4]/50 blur-2xl" />
              <HeroPhoneMockup />
            </div>
          </div>
        </section>
        {/* Trusted by */}
        <section className="border-y border-neutral-200 bg-white py-12">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <p className="text-center text-sm text-neutral-500">
              Trusted by Australian service businesses
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Day Spas", icon: Sparkles },
                { label: "Hair Salons", icon: Scissors },
                { label: "Beauty Clinics", icon: Sparkles },
                { label: "Barbershops", icon: Scissors },
                { label: "Cleaning Services", icon: SprayCan },
                { label: "Medical Practices", icon: Stethoscope },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <Icon className="size-5" style={{ color: ACCENT }} />
                  <span className="text-xs text-neutral-600 sm:text-sm">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {[
              {
                title: "Online Booking",
                copy: "Let your customers book 24/7 from any device.",
                icon: CalendarDays,
              },
              {
                title: "Take Deposits",
                copy: "Secure bookings with online deposits.",
                icon: CreditCard,
              },
              {
                title: "Automatic Reminders",
                copy: "Reduce no-shows with SMS & email reminders.",
                icon: Bell,
              },
              {
                title: "Reports & Insights",
                copy: "Track performance and grow your business.",
                icon: BarChart3,
              },
            ].map(({ title, copy, icon: Icon }) => (
              <div key={title} className="space-y-3">
                <span
                  className="inline-flex size-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
                >
                  <Icon className="size-4" />
                </span>
                <h2 className="text-[15px] font-bold text-neutral-950">{title}</h2>
                <p className="text-sm leading-relaxed text-neutral-600">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* All-in-one */}
        <section
          id="demo"
          className="border-t border-neutral-200 bg-[#FAFAF9] py-16 sm:py-20"
        >
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
            <DeviceStack />
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: ACCENT }}
              >
                All-in-one
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                Everything you need in one simple platform.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-600">
                Run bookings, staff, rooms, and payments together — without
                juggling separate tools.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Staff & resource management",
                  "Flexible scheduling",
                  "Payments with Stripe",
                  "Detailed reports",
                  "Customer management",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <Check
                      className="mt-0.5 size-4 shrink-0 stroke-[3]"
                      style={{ color: ACCENT }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-[#F7F3FF] py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Loved by business owners
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  quote:
                    "Deposits cut our no-shows almost overnight. The booking page is easy for customers too.",
                  name: "Emma T.",
                  role: "Day Spa Owner, Sydney",
                },
                {
                  quote:
                    "Finally one place for staff, rooms, and payments. Setup took an afternoon, not a week.",
                  name: "James K.",
                  role: "Salon Owner, Melbourne",
                },
                {
                  quote:
                    "We went from paper diaries to live bookings. Clients love booking after hours.",
                  name: "Priya S.",
                  role: "Beauty Clinic, Brisbane",
                },
              ].map((item) => (
                <article
                  key={item.name}
                  className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex gap-0.5 text-sm" style={{ color: ACCENT }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} aria-hidden>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                    “{item.quote}”
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <span
                      className="flex size-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {item.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-500">{item.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Ready to grow your business?
          </h2>
          <Link
            href="/platform"
            className="mt-7 inline-flex h-11 items-center rounded-full px-7 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            Start Your Free Trial
          </Link>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_repeat(4,1fr)]">
            <div className="space-y-3">
            <AllBookLogo size="sm" variant="blue" />
            <p className="max-w-xs text-sm leading-relaxed text-neutral-500">
              Booking software for Australian service businesses. Book. Get
              Paid. Grow.
            </p>
          </div>
          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Demo", "Integrations"],
            },
            {
              title: "Industries",
              links: ["Day Spas", "Salons", "Clinics", "Barbers"],
            },
            {
              title: "Resources",
              links: ["Help centre", "Guides", "Blog", "Status"],
            },
            {
              title: "Company",
              links: ["About", "Contact", "Privacy", "Terms"],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-neutral-900">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-neutral-500">{link}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-200">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5 text-xs text-neutral-500 sm:px-8">
            <p>
              © {new Date().getFullYear()} AllBook
              {isLive ? "" : ". Sample design · not final"}
            </p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                Australia
              </span>
              <Share2 className="size-3.5" />
            </div>
          </div>
        </div>
      </footer>

      {isLive ? null : <LandingSampleSwitcher active={3} tone="light" />}
    </div>
  );
}

/** Hero phone — crisp AllBook logo on a clean booking splash UI. */
function HeroPhoneMockup() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[2rem] bg-neutral-950 p-[10px] shadow-[0_22px_50px_rgba(28,25,23,0.18)] ring-1 ring-black/10"
      aria-label="AllBook booking app on a phone"
    >
      <div className="relative overflow-hidden rounded-[1.45rem] bg-white">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-neutral-800">
          <span>9:41</span>
          <span className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-neutral-950" />
          <span className="flex items-center gap-1 text-neutral-500">
            <span className="size-1.5 rounded-full bg-neutral-800" />
            <span className="size-1.5 rounded-full bg-neutral-800" />
            <span className="size-1.5 rounded-full bg-neutral-400" />
          </span>
        </div>

        {/* App chrome */}
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <AllBookLogo size="sm" variant="blue" />
          <span className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <span className="flex flex-col gap-[3px]">
              <span className="h-px w-3.5 bg-current" />
              <span className="h-px w-3.5 bg-current" />
              <span className="h-px w-3.5 bg-current" />
            </span>
          </span>
        </div>

        {/* Splash / logo focus */}
        <div className="mx-3 mb-3 flex flex-col items-center rounded-2xl bg-[#F4F0EA] px-4 py-10">
          <AllBookLogo size="xl" variant="blue" layout="vertical" />
          <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-500">
            <span className="block">Book</span>
            <span className="block">Get Paid</span>
            <span className="block">Grow</span>
          </p>
        </div>

        {/* Mini booking list */}
        <div className="space-y-2 px-4 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C4A574]">
            Book appointment
          </p>
          <p className="text-sm font-bold text-neutral-900">Choose your therapist</p>
          {[
            ["Emma", "Deep tissue"],
            ["Mia", "Hot stone"],
            ["Sophie", "Facial"],
          ].map(([name, service]) => (
            <div
              key={name}
              className="flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50/80 px-2.5 py-2"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2563FF]/10 text-[10px] font-bold text-[#2563FF]">
                {name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-neutral-900">{name}</p>
                <p className="truncate text-[10px] text-neutral-500">{service}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Book
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeviceStack() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.1)]">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
          <span className="size-2 rounded-full bg-neutral-300" />
          <span className="size-2 rounded-full bg-neutral-300" />
          <span className="size-2 rounded-full bg-neutral-300" />
          <span className="ml-3 text-[11px] text-neutral-400">Admin · Dashboard</span>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Bookings", value: "24" },
              { label: "Revenue", value: "$2.4k" },
              { label: "Staff", value: "6" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5"
              >
                <p className="text-[10px] text-neutral-500">{stat.label}</p>
                <p className="text-sm font-bold text-neutral-900">{stat.value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-800">Upcoming bookings</p>
            <ul className="mt-2 divide-y divide-neutral-100 rounded-xl border border-neutral-100">
              {[
                ["Sarah L.", "Massage", "2:00 PM", "Confirmed"],
                ["Tom W.", "Facial", "3:30 PM", "Deposit paid"],
                ["Mia C.", "Deep tissue", "5:00 PM", "Confirmed"],
              ].map(([name, service, time, status]) => (
                <li
                  key={name}
                  className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2.5 text-[11px] sm:grid-cols-[1fr_1fr_auto_auto]"
                >
                  <span className="font-semibold text-neutral-800">{name}</span>
                  <span className="hidden text-neutral-500 sm:inline">{service}</span>
                  <span className="text-neutral-500">{time}</span>
                  <span className="font-medium" style={{ color: ACCENT }}>
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 -bottom-6 w-[42%] overflow-hidden rounded-[1.35rem] border-[5px] border-neutral-900 bg-white shadow-xl sm:-right-4 sm:bottom-[-1.5rem]">
        <div className="h-3 bg-neutral-900" />
        <div className="space-y-2 p-2.5">
          <p className="text-[10px] font-bold text-neutral-900">Confirm</p>
          <div className="rounded-lg bg-neutral-50 p-2 text-[9px] text-neutral-600">
            Emma · Wed 2:00 PM
            <br />
            Deposit $20
          </div>
          <div
            className="rounded-lg py-2 text-center text-[9px] font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Confirm Booking
          </div>
        </div>
      </div>
    </div>
  );
}
