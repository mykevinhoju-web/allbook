"use client";

import type { CustomerTimelineEvent } from "@/features/customers";

type CustomerTimelineProps = {
  events: CustomerTimelineEvent[];
};

const LABELS: Record<CustomerTimelineEvent["eventType"], string> = {
  booking_created: "Booking created",
  booking_completed: "Booking completed",
  booking_cancelled: "Cancelled",
  review_submitted: "Review submitted",
  payment_completed: "Payment completed",
  note_added: "Note added",
  status_changed: "Status changed",
};

export function CustomerTimeline({ events }: CustomerTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-center text-[13px] text-neutral-500">
        No timeline events yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li
          key={event.id}
          className="relative rounded-2xl border border-neutral-200 bg-white px-4 py-3 pl-10"
        >
          <span className="absolute left-4 top-4 size-2 rounded-full bg-neutral-950" />
          <p className="text-[13px] font-semibold text-neutral-900">
            {LABELS[event.eventType]}
          </p>
          {event.detail ? (
            <p className="mt-0.5 text-[12px] text-neutral-500">{event.detail}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-neutral-400">
            {new Date(event.createdAt).toLocaleString("en-AU")}
          </p>
        </li>
      ))}
    </ol>
  );
}
