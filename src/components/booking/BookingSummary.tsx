"use client";

import { cn } from "@/lib/utils";

type BookingSummaryProps = {
  salonName: string;
  serviceName: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration: number;
  priceLabel: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  className?: string;
};

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BookingSummary({
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
  className,
}: BookingSummaryProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-neutral-200 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:p-6",
        className,
      )}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
        Booking summary
      </p>
      <h3 className="mt-2 text-[20px] font-semibold tracking-tight text-neutral-950">
        {salonName}
      </h3>

      <dl className="mt-5 space-y-3 text-[14px]">
        <Row label="Service" value={serviceName} />
        <Row label="Staff" value={staffName} />
        <Row label="Date" value={formatDate(date)} />
        <Row
          label="Time"
          value={endTime ? `${startTime} – ${endTime}` : startTime}
        />
        <Row label="Duration" value={`${duration} min`} />
        <Row label="Price" value={priceLabel} />
        {customerName ? <Row label="Name" value={customerName} /> : null}
        {customerEmail ? <Row label="Email" value={customerEmail} /> : null}
        {customerPhone ? <Row label="Phone" value={customerPhone} /> : null}
      </dl>

      <p className="mt-5 rounded-2xl bg-[#FAFBFC] px-4 py-3 text-[12px] text-neutral-500">
        Your booking is held as pending until the salon confirms.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
