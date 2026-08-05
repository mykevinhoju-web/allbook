"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CreditCard,
  Gift,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { PlatformDemoPhoneDialog } from "@/features/booking/components/platform-demo-phone-dialog";
import { cn } from "@/lib/utils";

import { AllBookLogo } from "./allbook-logo";
import { LandingSampleSwitcher } from "./landing-sample-switcher";

const ACCENT = "#2563FF";

/**
 * Sample 5 — Vista
 * Premium marketplace-inspired hero (layout only); body sections match Pulse.
 */
export function LandingSampleVista({
  mode = "sample",
}: {
  mode?: "sample" | "live";
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const isLive = mode === "live";

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const openDemo = () => {
    const mobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;
    if (mobile) {
      router.push("/booking");
      return;
    }
    setDemoOpen(true);
  };

  return (
    <div
      className={cn(
        "landing-vista min-h-svh bg-white text-neutral-900",
        "font-[family-name:var(--font-landing-pulse)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes vista-rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .landing-vista [data-rise] {
          opacity: 0;
        }
        .landing-vista[data-ready="true"] [data-rise] {
          animation: vista-rise 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .landing-vista[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.04s;
        }
        .landing-vista[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.14s;
        }
        .landing-vista[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.24s;
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href={isLive ? "/" : "/landing/samples/5"} className="inline-flex">
            <AllBookLogo size="sm" variant="blue" />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 lg:flex">
            {["Features", "Pricing", "Demo"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="transition hover:text-neutral-950"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-neutral-600 transition hover:text-neutral-950 sm:inline"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — marketplace-inspired split: copy + CTA card | photo + phone */}
        <section className="relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,255,0.06),transparent_50%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-20">
            <div className="relative z-10 max-w-xl">
              <p
                data-rise="1"
                className="text-xs font-bold uppercase tracking-[0.18em]"
                style={{ color: ACCENT }}
              >
                AllBook for Australian businesses
              </p>
              <h1
                data-rise="1"
                className="mt-4 text-[clamp(2.35rem,5.2vw,3.55rem)] font-bold leading-[1.05] tracking-tight text-neutral-950"
              >
                Book. Get Paid.
                <span className="mt-1 block" style={{ color: ACCENT }}>
                  Grow.
                </span>
              </h1>
              <p
                data-rise="2"
                className="mt-5 max-w-lg text-base leading-relaxed text-neutral-600 sm:text-lg"
              >
                The all-in-one booking &amp; payment platform for Australian
                service businesses. Accept bookings 24/7, reduce no-shows with
                automated reminders, get paid faster, and grow your business.
              </p>
              <p
                data-rise="2"
                className="mt-3 text-sm text-neutral-500"
              >
                Supports English, 한국어, 中文 and 日本語.
              </p>

              {/* Premium CTA card (layout inspired by marketplace search card) */}
              <div
                data-rise="3"
                className="mt-8 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_16px_48px_rgba(15,23,42,0.08)] sm:p-5"
              >
                <ul className="grid gap-2.5 sm:grid-cols-3">
                  {[
                    "Online booking 24/7",
                    "SMS & Email reminders",
                    "Secure online payments",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs font-semibold text-neutral-800 sm:text-[13px]"
                    >
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <Check className="size-3 stroke-[3]" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <Link
                    href="/signup"
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Start Free
                  </Link>
                  <button
                    type="button"
                    onClick={openDemo}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    View Demo
                  </button>
                </div>
              </div>

              <div
                data-rise="3"
                className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500 sm:text-[13px]"
              >
                <span>No lock-in</span>
                <span className="hidden text-neutral-300 sm:inline">·</span>
                <span>Stripe ready</span>
                <span className="hidden text-neutral-300 sm:inline">·</span>
                <span>Cancel anytime</span>
              </div>
            </div>

            <div
              data-rise="3"
              className="relative mx-auto w-full max-w-md lg:ml-auto lg:max-w-none"
            >
              <div className="relative overflow-hidden rounded-[1.75rem] bg-neutral-100 shadow-[0_24px_64px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/spa-flatlay-ref.png"
                  alt=""
                  className="h-[min(52vh,420px)] w-full object-cover object-center lg:h-[520px]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/25 via-transparent to-transparent" />
              </div>

              <div className="absolute -bottom-6 left-1/2 w-[58%] max-w-[240px] -translate-x-1/2 sm:-bottom-8 sm:left-auto sm:right-6 sm:translate-x-0 sm:max-w-[260px] lg:right-8 lg:max-w-[280px]">
                <div className="overflow-hidden rounded-[1.5rem] bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.22)] ring-1 ring-black/10">
                  <div className="relative overflow-hidden rounded-[1.15rem]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/landing/hero-phone-mockup.png"
                      alt="AllBook booking app on a phone"
                      width={768}
                      height={1024}
                      className="h-auto w-full object-cover object-top"
                    />
                    <div
                      className="pointer-events-none absolute z-10 flex items-center rounded-md bg-white px-1.5 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      style={{
                        left: "19.5%",
                        top: "11.2%",
                        width: "32%",
                      }}
                    >
                      <AllBookLogo
                        size="sm"
                        variant="blue"
                        className="origin-left scale-[0.92]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-10 sm:h-14" aria-hidden />
        </section>
        {/* Why salon owners choose Allbook */}
        <section className="border-y border-neutral-200/80 bg-[#FAFBFF] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7C3AED]">
                Built for busy salons
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                Why salon owners choose Allbook
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
                Everything you need to take bookings, get paid, and grow — without
                the clutter.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {[
                {
                  title: "Online Booking 24/7",
                  copy: "Customers can book anytime.",
                  icon: CalendarClock,
                },
                {
                  title: "Reduce No-Shows",
                  copy: "Automatic SMS & Email reminders.",
                  icon: Bell,
                },
                {
                  title: "Get Paid Faster",
                  copy: "Secure online payments with Stripe.",
                  icon: CreditCard,
                },
                {
                  title: "Manage Clients",
                  copy: "Simple CRM with customer history.",
                  icon: Users,
                },
                {
                  title: "Grow Your Business",
                  copy: "Reports, analytics and marketing tools.",
                  icon: TrendingUp,
                },
                {
                  title: "Free Forever",
                  copy: "No monthly fee. No lock-in contract.",
                  icon: Gift,
                },
              ].map(({ title, copy, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(124,58,237,0.1)] sm:p-7"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED]">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <h3 className="mt-5 text-[15px] font-bold tracking-tight text-neutral-950 sm:text-base">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Everything your shop needs to take bookings
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
              One platform for front-of-house and back-of-house — customise it to
              your brand, services, and staff.
            </p>
          </div>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {[
              {
                title: "Online Booking",
                copy: "Customers book 24/7 — Korean, Chinese, Japanese & English friendly.",
                icon: CalendarDays,
              },
              {
                title: "Take Deposits",
                copy: "Secure bookings with Stripe deposits in Australian dollars.",
                icon: CreditCard,
              },
              {
                title: "Customisable",
                copy: "Match your branding, services, rooms, and staff workflows.",
                icon: Sparkles,
              },
              {
                title: "Any Industry",
                copy: "Spas, salons, clinics, cleaning — or your unique business.",
                icon: Building2,
              },
            ].map(({ title, copy, icon: Icon }) => (
              <div key={title} className="space-y-3">
                <span
                  className="inline-flex size-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
                >
                  <Icon className="size-4" />
                </span>
                <h3 className="text-[15px] font-bold text-neutral-950">{title}</h3>
                <p className="text-sm leading-relaxed text-neutral-600">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Multilingual AU businesses + customisation */}
        <section
          id="pricing"
          className="border-y border-neutral-200 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto grid max-w-5xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: ACCENT }}
              >
                For Asian businesses in Australia
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                Made for Korean, Chinese & Japanese shops
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-600">
                Sydney, Melbourne, Brisbane and beyond — AllBook helps Korean,
                Chinese, and Japanese-owned service businesses take online bookings
                without complex overseas tools. Local Stripe payments in AUD.
              </p>
              <div className="mt-4 space-y-2 text-sm leading-relaxed text-neutral-500">
                <p>Supports English, 한국어, 中文 and 日本語.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-[#FAFAF9] p-6 sm:p-8">
              <h3 className="text-lg font-bold text-neutral-950">
                Customisable for any business
              </h3>
              <ul className="mt-5 space-y-3">
                {[
                  "Your logo, colours, and booking page",
                  "Services, durations, and deposit rules you choose",
                  "Staff, rooms, and schedules that fit your shop",
                  "Works for beauty, wellness, healthcare, cleaning — or something new",
                  "Free trial · no lock-in · cancel anytime",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-neutral-700"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 stroke-[3]"
                      style={{ color: ACCENT }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto sm:px-7"
                style={{ backgroundColor: ACCENT }}
              >
                Start free trial
              </Link>
            </div>
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
                One platform — tailored to how you work.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-600">
                Run bookings, staff, rooms, and payments together. We customise
                AllBook for your industry so you are not stuck with a one-size
                template.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Staff & room management",
                  "Flexible scheduling for any service length",
                  "Stripe deposits in AUD",
                  "Reports built for busy owners",
                  "Customer list in one place",
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
              Trusted by service businesses across Australia
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  quote:
                    "한국어로도 설명 받을 수 있어서 좋았어요. 예약·보증금이 한곳에 정리됐습니다.",
                  name: "Minji K.",
                  role: "Korean Day Spa, Sydney",
                },
                {
                  quote:
                    "Finally one place for staff, rooms, and payments. They customised it for our salon workflow.",
                  name: "James K.",
                  role: "Salon Owner, Melbourne",
                },
                {
                  quote:
                    "We run beauty and wellness under one roof. AllBook adapted to both — not just a spa template.",
                  name: "Sora P.",
                  role: "Multi-service Studio, Brisbane",
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
            Ready to customise AllBook for your business?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-600 sm:text-base">
            Free trial for Australian service businesses — Korean, Chinese &
            Japanese-owned shops welcome. Any industry.
          </p>
          <Link
            href="/signup"
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
              Customisable booking software for Australian service businesses —
              including Korean, Chinese & Japanese-owned shops. Any industry.
              Book. Get Paid. Grow.
            </p>
          </div>
          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Demo", "Customisation"],
            },
            {
              title: "Industries",
              links: ["Day Spas", "Salons", "Clinics", "Any business"],
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

      {isLive ? null : <LandingSampleSwitcher active={5} tone="light" />}
      <PlatformDemoPhoneDialog open={demoOpen} onOpenChange={setDemoOpen} />
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
