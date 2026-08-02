"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  MessageSquare,
  Scissors,
  Sparkles,
  Star,
  Stethoscope,
  SprayCan,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { AllBookLogo } from "./allbook-logo";
import { LandingSampleSwitcher } from "./landing-sample-switcher";

const INK = "#1C1917";
const ACCENT = "#9A6B45";
const PLANT =
  "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=70";

/**
 * Sample 4 — Linen
 * Soft beige SaaS landing based on the user’s clean booking-card mockup.
 */
export function LandingSampleLinen() {
  const [ready, setReady] = useState(false);
  const [service, setService] = useState("massage");

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "landing-linen min-h-svh bg-[#F7F3EE] text-[#1C1917]",
        "font-[family-name:var(--font-landing-pulse)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes linen-rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .landing-linen [data-rise] {
          opacity: 0;
        }
        .landing-linen[data-ready="true"] [data-rise] {
          animation: linen-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .landing-linen[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.05s;
        }
        .landing-linen[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.14s;
        }
        .landing-linen[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.24s;
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-[#E8E0D6]/80 bg-[#F7F3EE]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/landing/samples/4" className="inline-flex">
            <AllBookLogo size="sm" variant="blue" />
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-stone-500 lg:flex">
            {["Features", "Industries", "Pricing", "Demo", "Resources"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="hover:text-stone-900"
                >
                  {item}
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/platform"
              className="hidden text-sm font-medium text-stone-600 hover:text-stone-900 sm:inline"
            >
              Log in
            </Link>
            <Link
              href="/platform"
              className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: INK }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(154,107,69,0.08),transparent_50%)]" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-20">
            <div className="max-w-xl">
              <p
                data-rise="1"
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: ACCENT }}
              >
                Simple booking. More business.
              </p>
              <h1
                data-rise="1"
                className="mt-3 text-[clamp(2.1rem,4.8vw,3.15rem)] font-bold leading-[1.1] tracking-tight"
              >
                Easy to set up.
                <br />
                Easy for customers.
                <br />
                Less no-shows.
              </h1>
              <p
                data-rise="2"
                className="mt-5 max-w-md text-base leading-relaxed text-stone-600"
              >
                AllBook helps Australian day spas and beauty businesses take
                bookings online, collect deposits, and fill the diary with less
                admin.
              </p>

              <div data-rise="3" className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/platform"
                  className="inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: INK }}
                >
                  Start Free Trial
                </Link>
                <Link
                  href="https://dayspa.allbook.com.au/booking"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-800 hover:text-stone-950"
                >
                  Watch Demo
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              <ul
                data-rise="3"
                className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-500 sm:text-[13px]"
              >
                {[
                  "No lock-in contract",
                  "Stripe connected",
                  "SMS reminders",
                ].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="size-3.5" style={{ color: ACCENT }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div data-rise="3" className="relative mx-auto w-full max-w-md lg:max-w-none">
              {/* Soft plant lifestyle cue */}
              <div className="pointer-events-none absolute -right-2 top-6 hidden h-44 w-36 overflow-hidden rounded-2xl opacity-80 sm:block lg:-right-4 lg:top-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PLANT}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#F7F3EE]/20 to-[#F7F3EE]/70" />
              </div>

              <div className="relative rounded-2xl border border-[#E8E0D6] bg-white p-5 shadow-[0_20px_50px_rgba(28,25,23,0.08)] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Your Beauty Spa</p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Choose a service to continue
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F7F3EE] px-2.5 py-1 text-[10px] font-semibold text-stone-600">
                    Step 1 of 4
                  </span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F0EAE2]">
                  <div
                    className="h-full w-1/4 rounded-full"
                    style={{ backgroundColor: ACCENT }}
                  />
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    {
                      id: "massage",
                      name: "Relaxation Massage",
                      meta: "60 min",
                      price: "$120",
                    },
                    {
                      id: "facial",
                      name: "Facial Treatment",
                      meta: "45 min",
                      price: "$95",
                    },
                    {
                      id: "deep",
                      name: "Deep Tissue",
                      meta: "90 min",
                      price: "$160",
                    },
                  ].map((row) => {
                    const selected = service === row.id;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setService(row.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                          selected
                            ? "border-[#C4A484] bg-[#FBF7F2]"
                            : "border-[#EEE7DE] bg-white hover:border-[#E0D5C8]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-[#9A6B45] bg-[#9A6B45]"
                              : "border-stone-300",
                          )}
                        >
                          {selected ? (
                            <span className="size-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">
                            {row.name}
                          </span>
                          <span className="text-xs text-stone-500">{row.meta}</span>
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                          {row.price}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: INK }}
                >
                  Continue
                </button>
              </div>

              <div className="absolute -bottom-3 -left-2 rounded-full border border-[#E8E0D6] bg-white px-3 py-2 text-[11px] font-semibold shadow-md sm:-left-4">
                Reduce no-shows by up to{" "}
                <span style={{ color: ACCENT }}>60%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted by */}
        <section className="border-y border-[#E8E0D6]/80 bg-white/50 py-10">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              Trusted by
            </p>
            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Day spas", icon: Sparkles },
                { label: "Hair salons", icon: Scissors },
                { label: "Beauty clinics", icon: Sparkles },
                { label: "Barbershops", icon: Scissors },
                { label: "Cleaning", icon: SprayCan },
                { label: "Medical", icon: Stethoscope },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 text-center text-stone-500"
                >
                  <Icon className="size-5" />
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Simple Booking",
                copy: "Customers book online in a few taps — phone or desktop.",
                icon: CalendarDays,
              },
              {
                title: "Take Deposits",
                copy: "Secure appointments with Stripe deposits at booking time.",
                icon: CreditCard,
              },
              {
                title: "Reminders",
                copy: "SMS and email reminders that cut no-shows.",
                icon: Bell,
              },
              {
                title: "Clear Reports",
                copy: "See bookings, revenue, and quieter hours at a glance.",
                icon: Star,
              },
            ].map(({ title, copy, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-[#E8E0D6] bg-white p-5 shadow-[0_8px_24px_rgba(28,25,23,0.03)]"
              >
                <span
                  className="inline-flex size-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
                >
                  <Icon className="size-4" />
                </span>
                <h2 className="mt-4 text-[15px] font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="demo" className="border-t border-[#E8E0D6]/80 bg-white/60 py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              How AllBook works
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-5">
              {[
                { n: "1", title: "Create account", icon: UserPlus },
                { n: "2", title: "Add services", icon: FileText },
                { n: "3", title: "Share link", icon: MessageSquare },
                { n: "4", title: "Take bookings", icon: CalendarDays },
                { n: "5", title: "Get paid", icon: CreditCard },
              ].map((step, index) => (
                <div key={step.n} className="relative text-center">
                  {index < 4 ? (
                    <span className="absolute top-4 left-[58%] hidden h-px w-[84%] bg-[#E0D5C8] sm:block" />
                  ) : null}
                  <span
                    className="relative z-[1] mx-auto flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: INK }}
                  >
                    {step.n}
                  </span>
                  <step.icon className="mx-auto mt-4 size-5 text-stone-700" />
                  <p className="mt-2 text-sm font-semibold">{step.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quote + dashboard */}
        <section className="bg-[#EFE8DF] py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <p className="text-2xl font-semibold leading-snug tracking-tight sm:text-[1.65rem]">
                “AllBook is so easy to use. Customers book themselves — and
                deposits changed our no-show rate.”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span
                  className="flex size-10 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  ET
                </span>
                <div>
                  <p className="text-sm font-semibold">Emma T.</p>
                  <p className="text-xs text-stone-600">Spa Owner, Sydney</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E0D5C8] bg-white shadow-[0_18px_40px_rgba(28,25,23,0.08)]">
              <div className="flex items-center gap-1.5 border-b border-[#F0EAE2] bg-[#FAF7F3] px-4 py-2.5">
                <span className="size-2 rounded-full bg-[#E0D5C8]" />
                <span className="size-2 rounded-full bg-[#E0D5C8]" />
                <span className="size-2 rounded-full bg-[#E0D5C8]" />
                <span className="ml-2 text-[11px] text-stone-400">
                  Dashboard
                </span>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Bookings", "28"],
                    ["Revenue", "$3.1k"],
                    ["No-shows", "2"],
                    ["Deposits", "$540"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#F0EAE2] bg-[#FAF7F3] px-3 py-2.5"
                    >
                      <p className="text-[10px] text-stone-500">{label}</p>
                      <p className="text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold">Upcoming bookings</p>
                  <ul className="mt-2 divide-y divide-[#F0EAE2] rounded-xl border border-[#F0EAE2]">
                    {[
                      ["Sarah L.", "Massage", "2:00 PM", "Paid"],
                      ["Tom W.", "Facial", "3:30 PM", "Deposit"],
                      ["Mia C.", "Deep tissue", "5:00 PM", "Paid"],
                    ].map(([name, serviceLabel, time, status]) => (
                      <li
                        key={name}
                        className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2.5 text-[11px] sm:grid-cols-[1fr_1fr_auto_auto]"
                      >
                        <span className="font-semibold">{name}</span>
                        <span className="hidden text-stone-500 sm:inline">
                          {serviceLabel}
                        </span>
                        <span className="text-stone-500">{time}</span>
                        <span className="font-medium" style={{ color: ACCENT }}>
                          {status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready for fewer no-shows?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-stone-600">
            Start free, connect Stripe, and share your booking link today.
          </p>
          <Link
            href="/platform"
            className="mt-7 inline-flex h-11 items-center rounded-full px-7 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: INK }}
          >
            Start Free Trial
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#E8E0D6] bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-stone-500 sm:px-8">
          <AllBookLogo size="sm" variant="blue" />
          <span>Sample design · not final</span>
        </div>
      </footer>

      <LandingSampleSwitcher active={4} tone="light" />
    </div>
  );
}
