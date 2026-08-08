"use client";

import Link from "next/link";
import { useState } from "react";

import type { SalonPageData } from "@/features/salon";
import type { SalonServiceItem, SalonStaffMember } from "@/types/salon";

import { AboutSection } from "./AboutSection";
import { GallerySection } from "./GallerySection";
import { LocationSection } from "./LocationSection";
import { ReviewsSection } from "./ReviewsSection";
import { SalonHero } from "./SalonHero";
import { ServicesSection } from "./ServicesSection";
import { StaffSection } from "./StaffSection";
import { StickyBookingCard } from "./StickyBookingCard";

type SalonDetailViewProps = {
  data: SalonPageData;
  backHref?: string;
  bookHref?: string;
};

/**
 * Public salon detail page shell — reusable for every marketplace category.
 */
export function SalonDetailView({
  data,
  backHref = "/",
  bookHref,
}: SalonDetailViewProps) {
  const { salon, serviceGroups, staff, reviews } = data;
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const resolvedBookHref = salon.bookingEnabled
    ? (bookHref ?? `/${salon.service.toLowerCase()}/${salon.slug}/book`)
    : undefined;

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: salon.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied");
      window.setTimeout(() => setShareMessage(null), 2000);
    } catch {
      // cancelled
    }
  }

  function selectService(service: SalonServiceItem) {
    setSelectedServiceId(service.id);
  }

  function selectStaff(member: SalonStaffMember) {
    setSelectedStaffId(member.id);
  }

  return (
    <div className="min-h-svh bg-[#F6F6F7] text-neutral-950">
      <SalonHero
        salon={salon}
        backHref={backHref}
        bookHref={resolvedBookHref}
        onShare={handleShare}
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:px-8 lg:py-10">
        <div className="min-w-0 space-y-12 pb-28 lg:pb-10">
          <AboutSection salon={salon} />
          <ServicesSection
            groups={serviceGroups}
            bookHref={resolvedBookHref}
            selectedServiceId={selectedServiceId}
            onSelectService={selectService}
          />
          <StaffSection
            staff={staff}
            selectedStaffId={selectedStaffId}
            onSelectStaff={selectStaff}
          />
          <GallerySection images={salon.gallery} salonName={salon.name} />
          <ReviewsSection summary={reviews} />
          <LocationSection salon={salon} />
        </div>

        <div className="relative hidden lg:block">
          <div className="sticky top-6">
            {resolvedBookHref ? (
              <StickyBookingCard
                salon={salon}
                bookHref={resolvedBookHref}
              />
            ) : (
              <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 text-sm text-neutral-600 shadow-[0_16px_48px_rgba(17,17,17,0.06)] sm:p-6">
                <p className="font-semibold text-neutral-950">Booking</p>
                <p className="mt-2 text-neutral-500">
                  Online booking is not enabled for this business yet.
                </p>
                {salon.phone ? (
                  <a
                    href={`tel:${salon.phone}`}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold text-neutral-900"
                  >
                    Call {salon.phone}
                  </a>
                ) : null}
              </div>
            )}
            {shareMessage ? (
              <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
                {shareMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {resolvedBookHref ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 p-3 backdrop-blur-md lg:hidden">
          <Link
            href={resolvedBookHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white"
          >
            Book Now
          </Link>
        </div>
      ) : null}
    </div>
  );
}
