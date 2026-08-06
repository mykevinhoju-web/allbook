"use client";

import { useMemo, useState, useTransition } from "react";

import type { SalonPageData } from "@/features/salon";
import type { SalonServiceItem, SalonStaffMember } from "@/types/salon";

import { BookingSidebar, type BookingSelection } from "./BookingSidebar";
import { SalonGallery } from "./Gallery";
import { SalonHero } from "./Hero";
import { LocationMap } from "./LocationMap";
import { ReviewList } from "./ReviewList";
import { SalonInfo } from "./SalonInfo";
import { ServiceList } from "./ServiceList";
import { StaffList } from "./StaffList";

type SalonDetailViewProps = {
  data: SalonPageData;
  backHref?: string;
};

function emptySelection(): BookingSelection {
  return {
    service: null,
    staff: null,
    date: "",
    time: "",
  };
}

export function SalonDetailView({
  data,
  backHref = "/search",
}: SalonDetailViewProps) {
  const { salon, serviceGroups, staff, reviews } = data;
  const [selection, setSelection] = useState<BookingSelection>(emptySelection);
  const [, startTransition] = useTransition();
  const [bookedMessage, setBookedMessage] = useState<string | null>(null);

  const stickyOffset = useMemo(() => "top-6", []);

  function selectService(service: SalonServiceItem) {
    startTransition(() => {
      setSelection((prev) => ({ ...prev, service }));
      setBookedMessage(null);
      document
        .getElementById("salon-booking")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function selectStaff(member: SalonStaffMember) {
    startTransition(() => {
      setSelection((prev) => ({ ...prev, staff: member }));
      setBookedMessage(null);
    });
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: salon.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setBookedMessage("Link copied");
    } catch {
      // User cancelled share — ignore.
    }
  }

  function handleBook() {
    if (!selection.service || !selection.date || !selection.time) return;
    setBookedMessage(
      `Ready to book ${selection.service.name}${
        selection.staff ? ` with ${selection.staff.name}` : ""
      } on ${selection.date} at ${selection.time}. Checkout coming soon.`,
    );
  }

  return (
    <div className="min-h-svh bg-[#F6F6F7] text-neutral-950">
      <SalonHero salon={salon} backHref={backHref} onShare={handleShare} />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:px-8 lg:py-10">
        <div className="min-w-0 space-y-12 pb-28 lg:pb-10">
          <SalonInfo salon={salon} />
          <SalonGallery images={salon.gallery} salonName={salon.name} />
          <ServiceList
            groups={serviceGroups}
            selectedServiceId={selection.service?.id}
            onSelectService={selectService}
          />
          <StaffList
            staff={staff}
            selectedStaffId={selection.staff?.id}
            onSelectStaff={selectStaff}
          />
          <ReviewList summary={reviews} />
          <LocationMap salon={salon} />
        </div>

        <div className="relative hidden lg:block">
          <div id="salon-booking" className={`sticky ${stickyOffset}`}>
            <BookingSidebar
              selection={selection}
              onDateChange={(date) =>
                setSelection((prev) => ({ ...prev, date }))
              }
              onTimeChange={(time) =>
                setSelection((prev) => ({ ...prev, time }))
              }
              onBook={handleBook}
            />
            {bookedMessage ? (
              <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
                {bookedMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 p-3 backdrop-blur-md lg:hidden">
        <BookingSidebar
          compact
          selection={selection}
          onDateChange={(date) => setSelection((prev) => ({ ...prev, date }))}
          onTimeChange={(time) => setSelection((prev) => ({ ...prev, time }))}
          onBook={handleBook}
        />
      </div>
    </div>
  );
}
