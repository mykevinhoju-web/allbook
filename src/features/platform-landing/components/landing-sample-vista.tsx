"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  Building2,
  CalendarClock,
  Check,
  ContactRound,
  HandHeart,
  MapPin,
  MessageSquare,
  Scissors,
  Search,
  Share2,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
} from "lucide-react";

import { PlatformDemoPhoneDialog } from "@/features/booking/components/platform-demo-phone-dialog";
import { cn } from "@/lib/utils";

import { AllBookLogo } from "./allbook-logo";
import { LandingSampleSwitcher } from "./landing-sample-switcher";

const ACCENT = "#6B5CF6";

const CATEGORIES = [
  { id: "hair", label: "Hair Salon", icon: Scissors },
  { id: "nail", label: "Nail", icon: Sparkles },
  { id: "beauty", label: "Beauty", icon: Sparkles },
  { id: "massage", label: "Massage", icon: HandHeart },
  { id: "barber", label: "Barber", icon: Scissors },
] as const;

/**
 * Sample 5 — Vista
 * Marketplace hero matched to the supplied AllBook design (content + visuals).
 */
export function LandingSampleVista({
  mode = "sample",
}: {
  mode?: "sample" | "live";
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("hair");
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

      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href={isLive ? "/" : "/landing/samples/5"} className="inline-flex shrink-0">
            <AllBookLogo size="sm" variant="blue" className="[&_span]:!text-[#1B1F3B]" />
          </Link>

          <nav className="hidden items-center gap-5 text-[13px] font-medium text-[#5B6178] xl:flex">
            {[
              { label: "For Customers", href: "#for-customers" },
              { label: "For Shops", href: "#for-shops" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Jobs", href: "#demo", badge: "New" },
              { label: "About", href: "#demo" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-1.5 transition hover:text-[#1B1F3B]"
              >
                {item.label}
                {item.badge ? (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-[13px] font-medium text-[#5B6178] transition hover:text-[#1B1F3B] sm:inline"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-xl px-4 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — matched to marketplace design mock */}
        <section className="relative overflow-hidden bg-white">
          <div className="relative mx-auto grid max-w-[1180px] items-center gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-16 lg:pt-12">
            <div className="relative z-10 max-w-[560px]">
              <h1
                data-rise="1"
                className="text-[clamp(2.1rem,4.4vw,3.15rem)] font-bold leading-[1.12] tracking-tight text-[#1B1F3B]"
              >
                Find. Book. Get Beautiful.
                <span className="mt-1 block" style={{ color: ACCENT }}>
                  All in Allbook.
                </span>
              </h1>
              <p
                data-rise="2"
                className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-[#6B7289] sm:text-base"
              >
                The easiest way to discover and book trusted hair &amp; beauty
                salons in Australia. Free for salons. Easy for everyone.
              </p>

              <div
                data-rise="3"
                className="mt-7 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-[0_18px_50px_rgba(27,31,59,0.08)] sm:p-4"
              >
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {CATEGORIES.map(({ id, label, icon: Icon }) => {
                    const active = category === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setCategory(id)}
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                          active
                            ? "bg-[#EFEAFF] text-[#6B5CF6]"
                            : "text-[#7A8196] hover:bg-neutral-50",
                        )}
                      >
                        <Icon className="size-3.5" strokeWidth={2.2} />
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-[#FAFBFC] p-2 sm:flex-row sm:items-center sm:gap-0 sm:p-1.5">
                  <label className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2">
                    <MapPin className="size-4 shrink-0 text-[#6B5CF6]" />
                    <input
                      defaultValue="Brisbane, QLD"
                      className="w-full bg-transparent text-sm font-medium text-[#1B1F3B] outline-none placeholder:text-[#9AA0B4]"
                      aria-label="Location"
                    />
                  </label>
                  <span className="hidden h-8 w-px bg-neutral-200 sm:block" />
                  <label className="flex min-w-0 flex-[1.2] items-center gap-2 px-2.5 py-2">
                    <Search className="size-4 shrink-0 text-[#9AA0B4]" />
                    <input
                      placeholder="Search salon or service"
                      className="w-full bg-transparent text-sm text-[#1B1F3B] outline-none placeholder:text-[#9AA0B4]"
                      aria-label="Search salon or service"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={openDemo}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90 sm:ml-1"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div
                data-rise="3"
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                <span className="text-xs text-[#8B91A5]">Popular searches:</span>
                {[
                  "Korean Hair Salon",
                  "Balayage",
                  "Perm",
                  "Hair Colour",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={openDemo}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-[#5B6178] transition hover:border-[#6B5CF6]/40 hover:text-[#6B5CF6]"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div
                data-rise="3"
                className="mt-7 flex flex-col gap-3 text-[12px] text-[#6B7289] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:text-[13px]"
              >
                <span className="inline-flex items-center gap-2">
                  <Building2 className="size-4 text-[#6B5CF6]" />
                  200+ Salons in Brisbane
                </span>
                <span className="inline-flex items-center gap-2">
                  <HandHeart className="size-4 text-[#6B5CF6]" />
                  10,000+ Happy Customers
                </span>
                <span className="inline-flex items-center gap-2">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  4.9 Average Rating
                </span>
              </div>
            </div>

            <div
              data-rise="3"
              className="relative mx-auto w-full max-w-lg lg:max-w-none"
            >
              <div className="relative overflow-hidden rounded-[1.5rem] shadow-[0_24px_60px_rgba(27,31,59,0.14)] ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/marketplace-hero-visual.png"
                  alt="AllBook app on phone over a modern salon interior"
                  className="h-auto w-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </section>
        {/* Why salons love Allbook */}
        <section className="border-y border-neutral-100 bg-[#F7F8FC] py-16 sm:py-20">
          <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
            <h2 className="text-center text-2xl font-bold tracking-tight text-[#1B1F3B] sm:text-[1.75rem]">
              Why salons love Allbook
            </h2>

            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-6 lg:gap-x-5">
              {[
                {
                  title: "Online Booking 24/7",
                  copy: "Let customers book anytime, anywhere.",
                  icon: CalendarClock,
                },
                {
                  title: "No More No-Shows",
                  copy: "SMS & email reminders reduce no-shows.",
                  icon: MessageSquare,
                },
                {
                  title: "Get Paid Faster",
                  copy: "Secure online payments with Stripe.",
                  icon: BadgeDollarSign,
                },
                {
                  title: "Manage Your Clients",
                  copy: "CRM to manage clients and build loyalty.",
                  icon: ContactRound,
                },
                {
                  title: "Grow Your Business",
                  copy: "Insights & reports to help you grow.",
                  icon: TrendingUp,
                },
                {
                  title: "100% Free to Start",
                  copy: "No lock-in. No monthly fees. Ever.",
                  icon: Tag,
                },
              ].map(({ title, copy, icon: Icon }) => (
                <article
                  key={title}
                  className="flex flex-col items-center px-1 text-center"
                >
                  <Icon
                    className="size-8 text-[#6B5CF6] sm:size-9"
                    strokeWidth={1.6}
                  />
                  <h3 className="mt-4 text-[13px] font-bold leading-snug text-[#1B1F3B] sm:text-sm">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-[11rem] text-[12px] leading-relaxed text-[#6B7289] sm:text-[13px]">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Audience split — For Customers / For Shops */}
        <section id="features" className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1180px] gap-5 px-5 sm:px-8 lg:grid-cols-2 lg:gap-6">
            <article
              id="for-customers"
              className="grid overflow-hidden rounded-[1.5rem] bg-[#FFF9F2] sm:grid-cols-[1.05fr_0.95fr] lg:min-h-[420px]"
            >
              <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10">
                <p className="text-sm font-bold" style={{ color: ACCENT }}>
                  For Customers
                </p>
                <h2 className="mt-3 text-[1.65rem] font-bold leading-tight tracking-tight text-[#1B1F3B] sm:text-[1.85rem]">
                  Discover the best shops near you
                </h2>
                <ul className="mt-6 space-y-3">
                  {[
                    "Search by location, service or shop name",
                    "Compare reviews, pricing and photos",
                    "Book instantly and pay securely",
                    "Save your favourite shops",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[13px] leading-snug text-[#3F455A] sm:text-sm"
                    >
                      <span
                        className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <Check className="size-2.5 stroke-[3.5]" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={openDemo}
                  className="mt-8 inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Find a Shop
                </button>
              </div>
              <AudienceCustomerVisual />
            </article>

            <article
              id="for-shops"
              className="grid overflow-hidden rounded-[1.5rem] bg-[#F4F7FF] sm:grid-cols-[1.05fr_0.95fr] lg:min-h-[420px]"
            >
              <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10">
                <p className="text-sm font-bold" style={{ color: ACCENT }}>
                  For Shops
                </p>
                <h2 className="mt-3 text-[1.65rem] font-bold leading-tight tracking-tight text-[#1B1F3B] sm:text-[1.85rem]">
                  Your all-in-one booking platform
                </h2>
                <ul className="mt-6 space-y-3">
                  {[
                    "Free online booking system",
                    "Customisable shop page",
                    "SMS & email notifications",
                    "Client management & marketing tools",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[13px] leading-snug text-[#3F455A] sm:text-sm"
                    >
                      <span
                        className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <Check className="size-2.5 stroke-[3.5]" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-8 inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Start Free Now
                </Link>
              </div>
              <AudienceSalonVisual />
            </article>
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

function AudienceCustomerVisual() {
  return (
    <div
      aria-hidden
      className="relative mx-auto h-[220px] w-full max-w-[280px] sm:mx-0 sm:h-full sm:min-h-[320px] sm:max-w-none"
    >
      <div className="absolute right-[8%] top-[8%] w-[68%] overflow-hidden rounded-2xl shadow-[0_16px_36px_rgba(27,31,59,0.16)] ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/audience-salon-interior.jpg"
          alt=""
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
      <div className="absolute left-[4%] top-[36%] w-[52%] overflow-hidden rounded-2xl shadow-[0_16px_36px_rgba(27,31,59,0.18)] ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/audience-hair.jpg"
          alt=""
          className="aspect-[4/5] w-full object-cover object-top"
        />
      </div>
      <div className="absolute bottom-[8%] right-[10%] w-[58%] overflow-hidden rounded-2xl shadow-[0_16px_36px_rgba(27,31,59,0.18)] ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/audience-nails.jpg"
          alt=""
          className="aspect-[5/3] w-full object-cover"
        />
      </div>
    </div>
  );
}

function AudienceSalonVisual() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const slots = [
    { day: 1, row: 1, span: 2, label: "Cut" },
    { day: 2, row: 0, span: 1, label: "Colour" },
    { day: 3, row: 2, span: 2, label: "Balayage" },
    { day: 4, row: 1, span: 1, label: "Blow" },
    { day: 5, row: 0, span: 2, label: "Perm" },
  ];

  return (
    <div
      aria-hidden
      className="relative mx-auto h-[240px] w-full max-w-[280px] sm:mx-0 sm:h-full sm:min-h-[320px] sm:max-w-none"
    >
      <div className="absolute right-[6%] top-[10%] w-[82%] overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_18px_40px_rgba(27,31,59,0.14)]">
        <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2.5">
          <p className="text-[11px] font-bold text-[#1B1F3B]">May</p>
          <div className="flex gap-1">
            <span className="size-1.5 rounded-full bg-neutral-200" />
            <span className="size-1.5 rounded-full bg-neutral-200" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 px-2.5 pt-2">
          {days.map((d, i) => (
            <span
              key={`${d}-${i}`}
              className="text-center text-[8px] font-semibold text-[#9AA0B4]"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="relative mt-1 h-[120px] px-2.5 pb-3 sm:h-[150px]">
          <div className="grid h-full grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="relative rounded-md bg-[#F7F8FC]">
                {slots
                  .filter((s) => s.day === col)
                  .map((s) => (
                    <div
                      key={`${s.day}-${s.label}`}
                      className="absolute inset-x-0.5 rounded-md px-0.5 py-1 text-center text-[7px] font-semibold leading-tight text-[#5B4AE0]"
                      style={{
                        top: `${s.row * 28}%`,
                        height: `${s.span * 26}%`,
                        backgroundColor: "#E9E4FF",
                      }}
                    >
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-[6%] left-[2%] w-[56%] overflow-hidden rounded-[1.35rem] border-[5px] border-[#1B1F3B] bg-white shadow-[0_20px_40px_rgba(27,31,59,0.22)]">
        <div className="mx-auto mt-1.5 h-1 w-8 rounded-full bg-neutral-200" />
        <div className="space-y-2 px-2.5 pb-2.5 pt-2">
          <p className="text-[10px] font-bold text-[#1B1F3B]">Today&apos;s Bookings</p>
          <ul className="space-y-1.5">
            {[
              ["Jessica Lee", "Hair Cut"],
              ["Minji Kim", "Balayage"],
              ["Sara Park", "Blow Dry"],
            ].map(([name, service]) => (
              <li
                key={name}
                className="rounded-lg bg-[#F7F8FC] px-2 py-1.5"
              >
                <p className="text-[9px] font-semibold text-[#1B1F3B]">{name}</p>
                <p className="text-[8px] text-[#8B91A5]">{service}</p>
              </li>
            ))}
          </ul>
          <div
            className="rounded-lg py-1.5 text-center text-[9px] font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            + New Booking
          </div>
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
