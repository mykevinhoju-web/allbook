"use client";

import Link from "next/link";

import { CustomerNotes } from "./CustomerNotes";
import { CustomerStatisticsCards } from "./CustomerStatistics";
import { CustomerTags } from "./CustomerTags";
import { CustomerTimeline } from "./CustomerTimeline";
import {
  formatDateLabel,
  formatMoney,
  type SalonCustomer,
  type CustomerTag,
} from "@/features/customers";
import { cn } from "@/lib/utils";

type CustomerProfileProps = {
  customer: SalonCustomer;
  onAddNote: (note: string) => void;
  onTagsChange: (tags: CustomerTag[]) => void;
  onEdit: () => void;
  onBlock: () => void;
  onCreateBooking: () => void;
  onExport: () => void;
};

export function CustomerProfile({
  customer,
  onAddNote,
  onTagsChange,
  onEdit,
  onBlock,
  onCreateBooking,
  onExport,
}: CustomerProfileProps) {
  return (
    <div className="space-y-6 rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-950 text-[14px] font-semibold text-white">
            {customer.fullName
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-neutral-950">
              {customer.fullName}
            </h2>
            <p className="text-[13px] capitalize text-neutral-500">
              {customer.status} · Joined {formatDateLabel(customer.joinedAt.slice(0, 10))}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Action onClick={onCreateBooking}>Create booking</Action>
          <Action onClick={onEdit}>Edit</Action>
          <Action onClick={onExport}>Export</Action>
          <Action onClick={onBlock} danger>
            Block
          </Action>
        </div>
      </div>

      <div className="grid gap-3 text-[13px] sm:grid-cols-2">
        <Info label="Phone" value={customer.phone || "—"} />
        <Info label="Email" value={customer.email || "—"} />
        <Info label="Birthday" value={formatDateLabel(customer.birthday)} />
        <Info
          label="Preferred staff"
          value={customer.statistics.preferredStaffName ?? "—"}
        />
      </div>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">Tags</h3>
        <CustomerTags value={customer.tags} onChange={onTagsChange} />
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
          Statistics
        </h3>
        <CustomerStatisticsCards statistics={customer.statistics} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
            Upcoming
          </h3>
          <BookingList rows={customer.upcomingBookings} empty="No upcoming bookings." />
        </div>
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
            History
          </h3>
          <BookingList rows={customer.bookingHistory} empty="No completed visits." />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
          Favourite services
        </h3>
        <p className="text-[13px] text-neutral-600">
          {customer.favouriteServices.join(" · ") || "—"}
        </p>
      </section>

      {customer.media.length > 0 ? (
        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
            Before / after & uploads
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {customer.media.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.caption ?? ""} className="aspect-square object-cover" />
                <p className="px-2 py-1 text-[11px] capitalize text-neutral-500">
                  {item.mediaType}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
          Internal notes
        </h3>
        <CustomerNotes notes={customer.notes} onAdd={onAddNote} />
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold text-neutral-900">
          Timeline
        </h3>
        <CustomerTimeline events={customer.timeline} />
      </section>

      <p className="text-[12px] text-neutral-400">
        Loyalty points (future): {customer.loyaltyPoints} ·{" "}
        <Link href="/platform/salon/bookings" className="underline">
          View bookings
        </Link>
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 px-3 py-2">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p className="font-medium text-neutral-900">{value}</p>
    </div>
  );
}

function Action({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3.5 text-[12px] font-semibold",
        danger
          ? "border-rose-200 text-rose-700 hover:bg-rose-50"
          : "border-neutral-200 text-neutral-800 hover:bg-neutral-50",
      )}
    >
      {children}
    </button>
  );
}

function BookingList({
  rows,
  empty,
}: {
  rows: SalonCustomer["bookingHistory"];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-neutral-500">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-2xl border border-neutral-200 px-3 py-2 text-[13px]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-neutral-900">{row.serviceName}</span>
            <span className="tabular-nums text-neutral-600">
              {formatMoney(row.amount)}
            </span>
          </div>
          <p className="text-[12px] text-neutral-500">
            {row.staffName} · {formatDateLabel(row.bookingDate)} · {row.status}
          </p>
        </li>
      ))}
    </ul>
  );
}
