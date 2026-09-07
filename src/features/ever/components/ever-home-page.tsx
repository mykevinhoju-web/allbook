"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, Star, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { EverLogo } from "./ever-logo";
import { EVER_BRAND } from "../theme";
import {
  EVER_ABOUT,
  EVER_CONTACT,
  EVER_GALLERY,
  EVER_HERO,
  EVER_NAV,
  EVER_PRICE_MENUS,
  EVER_REVIEWS,
  EVER_SERVICES,
  EVER_WHY,
} from "../site-content";

const BOOK = "/booking";

/** Hero playlist: `public/ever/hero1.mp4`, `public/ever/hero2.mp4` */
const HERO_VIDEOS = ["/ever/hero1.mp4", "/ever/hero2.mp4"] as const;

const ABOUT_IMG =
  "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1400&q=80";
const GIFT_IMG =
  "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1400&q=80";

/**
 * Ever public homepage — Verdant forest + soft gold, full marketing site.
 */
export function EverHomePage() {
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div
      className={cn(
        "ever-site min-h-svh bg-[#121814] text-[#E9EDE8]",
        "font-[family-name:var(--font-ever-verdant-body)]",
      )}
      data-ready={ready ? "true" : "false"}
    >
      <style jsx global>{`
        @keyframes ever-fade {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes ever-glow {
          from {
            opacity: 0.25;
          }
          to {
            opacity: 0.65;
          }
        }
        .ever-site [data-rise] {
          opacity: 0;
        }
        .ever-site[data-ready="true"] [data-rise] {
          animation: ever-fade 0.95s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .ever-site[data-ready="true"] [data-rise="1"] {
          animation-delay: 0.06s;
        }
        .ever-site[data-ready="true"] [data-rise="2"] {
          animation-delay: 0.18s;
        }
        .ever-site[data-ready="true"] [data-rise="3"] {
          animation-delay: 0.3s;
        }
        .ever-site[data-ready="true"] [data-rise="4"] {
          animation-delay: 0.42s;
        }
        .ever-site[data-ready="true"] [data-glow] {
          animation: ever-glow 2.4s ease-out forwards;
        }
        .ever-site {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Sticky nav */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-300",
          scrolled || menuOpen
            ? "border-b border-white/8 bg-[#121814]/92 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:h-16 sm:px-8">
          <EverLogo href="/" width={76} priority className="sm:hidden" />
          <EverLogo href="/" width={92} priority className="hidden sm:block" />

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary"
          >
            {EVER_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-[13px] text-[#E9EDE8]/70 transition hover:text-[#E9EDE8]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={BOOK}
              className="hidden h-10 items-center rounded-full bg-[#C4A862] px-5 text-[13px] font-medium text-[#16140C] transition hover:bg-[#D2B872] sm:inline-flex"
            >
              Book Now
            </Link>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-[#E9EDE8] lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="ever-mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            id="ever-mobile-nav"
            className="border-t border-white/8 bg-[#121814] px-5 pb-8 pt-4 lg:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {EVER_NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-3 text-base text-[#E9EDE8]/85"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href={BOOK}
                onClick={closeMenu}
                className="mt-3 inline-flex h-12 items-center justify-center rounded-full bg-[#C4A862] text-sm font-medium text-[#16140C]"
              >
                Book Now
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section
          id="home"
          className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
        >
          <EverHeroBackground />

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-28 pt-24 sm:px-8 sm:pb-32 lg:justify-center lg:pb-24">
            <p
              data-rise="1"
              className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#C4A862]"
            >
              {EVER_HERO.eyebrow}
            </p>
            <h1
              data-rise="2"
              className="mt-5 max-w-3xl font-[family-name:var(--font-ever-verdant-display)] text-[clamp(2.35rem,6.5vw,4.6rem)] leading-[1.08] tracking-[-0.02em]"
            >
              {EVER_HERO.title}
            </h1>
            <p
              data-rise="3"
              className="mt-5 max-w-xl text-base leading-relaxed text-[#E9EDE8]/70 sm:text-lg"
            >
              {EVER_HERO.description}
            </p>
            <div data-rise="4" className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={BOOK}
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#C4A862] px-8 text-sm font-medium text-[#16140C] transition hover:bg-[#D2B872]"
              >
                Book Now
              </Link>
              <a
                href="#services"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-7 text-sm text-[#E9EDE8] transition hover:border-[#C4A862]/60 hover:bg-white/5"
              >
                View Services
              </a>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-24 border-t border-white/8 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Services"
              title="Our treatments"
              copy="Therapeutic massage and rejuvenating spa care designed to relax your body, refresh your mind, and restore natural balance."
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {EVER_SERVICES.map((service) => (
                <article
                  key={service.name}
                  className="group overflow-hidden rounded-3xl border border-white/8 bg-[#1B2E26]/35"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={service.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121814]/90 via-[#121814]/20 to-transparent" />
                  </div>
                  <div className="space-y-2 px-5 pb-6 pt-4">
                    <h3 className="font-[family-name:var(--font-ever-verdant-display)] text-xl text-[#E9EDE8]">
                      {service.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#E9EDE8]/55">
                      {service.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="prices"
          className="scroll-mt-24 border-t border-white/8 bg-[#0E1210] px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Popular services"
              title="Transparent pricing"
              copy="Wellness should feel both accessible and luxurious. Explore our clear rates and choose the treatment that suits you."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {EVER_PRICE_MENUS.map((menu) => (
                <div
                  key={menu.name}
                  className="flex flex-col rounded-3xl border border-[#C4A862]/25 bg-[#121814] p-7"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#C4A862]">
                    {menu.note}
                  </p>
                  <h3 className="mt-4 font-[family-name:var(--font-ever-verdant-display)] text-3xl">
                    {menu.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#E9EDE8]/55">
                    {menu.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {menu.tiers.map((tier) => (
                      <li
                        key={`${menu.name}-${tier.duration}`}
                        className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-3 text-sm last:border-0 last:pb-0"
                      >
                        <span className="text-[#E9EDE8]/75">{tier.duration}</span>
                        <span className="text-lg font-medium tracking-tight text-[#C4A862]">
                          {tier.price}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={BOOK}
                    className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[#C4A862] text-sm font-medium text-[#16140C] transition hover:bg-[#D2B872]"
                  >
                    Book Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why choose us */}
        <section className="border-t border-white/8 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Why Everwell"
              title="Why choose us"
              copy="A welcoming Brisbane CBD space dedicated to helping you slow down, recharge, and reconnect with your best self."
            />
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {EVER_WHY.map((item) => (
                <div key={item.title} className="space-y-3">
                  <div
                    className="h-px w-10"
                    style={{ background: EVER_BRAND.gold }}
                    aria-hidden
                  />
                  <h3 className="font-[family-name:var(--font-ever-verdant-display)] text-xl text-[#C4A862]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#E9EDE8]/55">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section
          id="about"
          className="scroll-mt-24 border-t border-white/8 px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
              <Image
                src={ABOUT_IMG}
                alt="Professional massage therapist providing a treatment"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#C4A862]">
                {EVER_ABOUT.eyebrow}
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-ever-verdant-display)] text-3xl sm:text-4xl">
                {EVER_ABOUT.title}
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#E9EDE8]/65">
                {EVER_ABOUT.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
              <Link
                href={BOOK}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-[#C4A862]/50 px-7 text-sm text-[#E9EDE8] transition hover:border-[#C4A862] hover:bg-[#C4A862]/10"
              >
                Book a session
              </Link>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section
          id="reviews"
          className="scroll-mt-24 border-t border-white/8 bg-[#0E1210] px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Reviews"
              title="Loved by our guests"
              copy="Five-star care from people who return for the calm, skill, and consistency."
            />
            <div className="mt-8 flex items-center gap-2 text-[#C4A862]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-current" aria-hidden />
              ))}
              <span className="ml-2 text-sm text-[#E9EDE8]/70">
                5.0 · Google Reviews
              </span>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {EVER_REVIEWS.map((review) => (
                <blockquote
                  key={review.name}
                  className="rounded-3xl border border-white/8 bg-[#121814] p-6"
                >
                  <div className="flex gap-0.5 text-[#C4A862]" aria-label="5 stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#E9EDE8]/75">
                    “{review.text}”
                  </p>
                  <footer className="mt-5 text-sm font-medium text-[#C4A862]">
                    {review.name}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section
          id="gallery"
          className="scroll-mt-24 border-t border-white/8 px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Gallery"
              title="A space to slow down"
              copy="Treatment rooms, quiet interiors, and the atmosphere of a restorative visit."
            />
            <div className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
              {EVER_GALLERY.map((shot) => (
                <div
                  key={shot.src}
                  className="relative aspect-[3/4] overflow-hidden rounded-2xl sm:rounded-3xl"
                >
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gift voucher */}
        <section className="border-t border-white/8 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2rem] border border-[#C4A862]/20 bg-[#1B2E26]/40 lg:grid-cols-2">
            <div className="relative aspect-[5/4] lg:aspect-auto lg:min-h-[420px]">
              <Image
                src={GIFT_IMG}
                alt="Spa wellness gift experience"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="px-6 pb-10 pt-2 sm:px-10 lg:py-12">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#C4A862]">
                Gift vouchers
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-ever-verdant-display)] text-3xl sm:text-4xl">
                Give the gift of rest
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#E9EDE8]/65">
                Share a calm hour (or more) with someone you care about. Gift
                vouchers are available for any treatment duration — a thoughtful
                present for birthdays, thank-yous, or a well-earned pause.
              </p>
              <a
                href={`mailto:${EVER_CONTACT.email}?subject=Gift%20voucher%20enquiry`}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[#C4A862] px-7 text-sm font-medium text-[#16140C] transition hover:bg-[#D2B872]"
              >
                Enquire about vouchers
              </a>
            </div>
          </div>
        </section>

        {/* Location */}
        <section
          id="contact"
          className="scroll-mt-24 border-t border-white/8 bg-[#0E1210] px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Visit us"
              title="Location &amp; hours"
              copy="Find us at 120 Mary Street, Brisbane City — easy to reach, calm once you’re inside."
            />
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-medium text-[#C4A862]">Address</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#E9EDE8]/75">
                    {EVER_CONTACT.addressLine}
                    <br />
                    {EVER_CONTACT.suburb}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#C4A862]">Phone</h3>
                  <a
                    href={`tel:${EVER_CONTACT.phoneTel}`}
                    className="mt-2 inline-block text-[15px] text-[#E9EDE8]/75 transition hover:text-[#E9EDE8]"
                  >
                    {EVER_CONTACT.phoneDisplay}
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#C4A862]">Email</h3>
                  <a
                    href={`mailto:${EVER_CONTACT.email}`}
                    className="mt-2 inline-block text-[15px] text-[#E9EDE8]/75 transition hover:text-[#E9EDE8]"
                  >
                    {EVER_CONTACT.email}
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#C4A862]">
                    Opening hours
                  </h3>
                  <ul className="mt-3 space-y-2 text-[15px] text-[#E9EDE8]/75">
                    {EVER_CONTACT.hours.map((row) => (
                      <li
                        key={row.days}
                        className="flex justify-between gap-6 border-b border-white/8 pb-2"
                      >
                        <span>{row.days}</span>
                        <span className="text-[#E9EDE8]/55">{row.hours}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-white/8">
                <iframe
                  title="Everwell Massage location on Google Maps"
                  src={EVER_CONTACT.mapsEmbed}
                  className="h-[320px] w-full border-0 sm:h-full sm:min-h-[420px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-white/8 px-5 py-24 text-center sm:px-8 sm:py-32">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-[family-name:var(--font-ever-verdant-display)] text-4xl sm:text-5xl">
              Ready to Relax?
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[#E9EDE8]/55">
              Reserve your appointment online — we’ll confirm shortly and welcome
              you into a quieter kind of care.
            </p>
            <Link
              href={BOOK}
              className="mt-9 inline-flex h-12 items-center justify-center rounded-full bg-[#C4A862] px-10 text-sm font-medium text-[#16140C] transition hover:bg-[#D2B872]"
            >
              Book Now
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <EverLogo href="/" width={96} />
            <p className="mt-4 max-w-xs text-sm text-[#E9EDE8]/40">
              Your escape to total relaxation in Brisbane CBD.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:gap-12">
            <div>
              <p className="font-medium text-[#E9EDE8]/80">Explore</p>
              <ul className="mt-3 space-y-2 text-[#E9EDE8]/40">
                {EVER_NAV.slice(1).map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="hover:text-[#E9EDE8]/70">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#E9EDE8]/80">Visit</p>
              <ul className="mt-3 space-y-2 text-[#E9EDE8]/40">
                <li>
                  {EVER_CONTACT.addressLine}, {EVER_CONTACT.suburb}
                </li>
                <li>
                  <a
                    href={`tel:${EVER_CONTACT.phoneTel}`}
                    className="hover:text-[#E9EDE8]/70"
                  >
                    {EVER_CONTACT.phoneDisplay}
                  </a>
                </li>
                <li>
                  <Link href={BOOK} className="hover:text-[#E9EDE8]/70">
                    Book online
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-white/8 pt-6 text-xs text-[#E9EDE8]/30">
          © {new Date().getFullYear()} Everwell Massage &amp; Wellness. All
          rights reserved.
        </div>
      </footer>

      {/* Sticky mobile Book Now */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden">
        <Link
          href={BOOK}
          className="pointer-events-auto flex h-12 w-full items-center justify-center rounded-full bg-[#C4A862] text-sm font-semibold text-[#16140C] shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
        >
          Book Now
        </Link>
      </div>
      {/* Spacer so sticky CTA doesn't cover footer on mobile */}
      <div className="h-20 sm:hidden" aria-hidden />
    </div>
  );
}

function EverHeroBackground() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);
  const [activeIndex, setActiveIndex] = useState(0);
  const switchingRef = useRef(false);

  useEffect(() => {
    const videos = videoRefs.current;
    videos.forEach((video) => {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
    });

    const current = videos[0];
    if (!current) return;
    void current.play().catch(() => {});
  }, []);

  useEffect(() => {
    switchingRef.current = false;
    const current = videoRefs.current[activeIndex];
    if (!current) return;

    const nextIndex = (activeIndex + 1) % HERO_VIDEOS.length;
    const next = videoRefs.current[nextIndex];

    if (next) {
      next.preload = "auto";
      if (next.readyState < 2) next.load();
    }

    const advance = () => {
      if (switchingRef.current) return;
      switchingRef.current = true;

      const upcoming = videoRefs.current[nextIndex];
      if (!upcoming) {
        switchingRef.current = false;
        return;
      }

      upcoming.currentTime = 0;
      void upcoming.play().catch(() => {});
      setActiveIndex(nextIndex);

      window.setTimeout(() => {
        current.pause();
      }, 950);
    };

    const onTimeUpdate = () => {
      if (
        Number.isFinite(current.duration) &&
        current.duration > 1 &&
        current.duration - current.currentTime <= 0.85
      ) {
        advance();
      }
    };

    current.addEventListener("timeupdate", onTimeUpdate);
    current.addEventListener("ended", advance);
    void current.play().catch(() => {});

    return () => {
      current.removeEventListener("timeupdate", onTimeUpdate);
      current.removeEventListener("ended", advance);
    };
  }, [activeIndex]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#121814]" aria-hidden>
      {HERO_VIDEOS.map((src, index) => (
        <video
          key={src}
          ref={(el) => {
            videoRefs.current[index] = el;
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[900ms] ease-in-out",
            index === activeIndex ? "opacity-100" : "opacity-0",
          )}
          muted
          playsInline
          preload={index === 0 ? "auto" : "metadata"}
          src={src}
          autoPlay={index === 0}
        />
      ))}
      <div className="absolute inset-0 bg-[#121814]/45" />
      <div
        data-glow
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_38%,rgba(196,168,98,0.16),transparent_55%)]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121814] via-[#121814]/20 to-[#121814]/35" />
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#C4A862]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-[family-name:var(--font-ever-verdant-display)] text-3xl sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-[#E9EDE8]/55">
        {copy}
      </p>
    </div>
  );
}
