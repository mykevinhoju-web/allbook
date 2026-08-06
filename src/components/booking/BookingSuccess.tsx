"use client";

import Link from "next/link";

import { BookingSummary } from "./BookingSummary";

type BookingSuccessProps = {
  salonName: string;
  serviceName: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  priceLabel: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  bookingId: string;
  backHref: string;
};

export function BookingSuccess({
  salonName,
  serviceName,
  staffName,
  date,
  startTime,
  endTime,
  duration,
  priceLabel,
  customerName,
  customerEmail,
  customerPhone,
  status,
  bookingId,
  backHref,
}: BookingSuccessProps) {
  return (
    <section className="space-y-5 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        ✓
      </div>
      <div>
        <h2 className="text-[22px] font-semibold text-neutral-950">
          Booking requested
        </h2>
        <p className="mt-2 text-[14px] text-neutral-600">
          Status: <strong className="capitalize">{status}</strong>
        </p>
        <p className="mt-1 font-mono text-[12px] text-neutral-400">
          Ref {bookingId}
        </p>
      </div>
      <BookingSummary
        salonName={salonName}
        serviceName={serviceName}
        staffName={staffName}
        date={date}
        startTime={startTime}
        endTime={endTime}
        duration={duration}
        priceLabel={priceLabel}
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
      />
      <Link
        href={backHref}
        className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white"
      >
        Done
      </Link>
    </section>
  );
}
