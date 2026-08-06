import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import type {
  DashboardBooking,
  DashboardBookingStatus,
} from "@/features/dashboard";
import { cn } from "@/lib/utils";

type BookingTableProps = {
  bookings: DashboardBooking[];
  title?: string;
  viewAllHref?: string;
  className?: string;
};

const STATUS_STYLES: Record<DashboardBookingStatus, string> = {
  confirmed: "bg-sky-50 text-sky-700",
  checked_in: "bg-emerald-50 text-emerald-700",
  completed: "bg-neutral-100 text-neutral-700",
  cancelled: "bg-rose-50 text-rose-700",
  pending: "bg-amber-50 text-amber-800",
};

const STATUS_LABELS: Record<DashboardBookingStatus, string> = {
  confirmed: "Confirmed",
  checked_in: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
  pending: "Pending",
};

export function BookingTable({
  bookings,
  title = "Recent bookings",
  viewAllHref = "/platform/salon/bookings",
  className,
}: BookingTableProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-950">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Today’s appointments at a glance.
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          View all
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[13px]">
          <thead className="bg-[#FAFBFC] text-[11px] uppercase tracking-[0.08em] text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-semibold sm:px-6">Customer</th>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Staff</th>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold sm:px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-t border-neutral-100 transition hover:bg-[#FAFBFC]"
              >
                <td className="px-5 py-3.5 font-medium text-neutral-900 sm:px-6">
                  {booking.customerName}
                </td>
                <td className="px-4 py-3.5 text-neutral-600">{booking.service}</td>
                <td className="px-4 py-3.5 text-neutral-600">{booking.staff}</td>
                <td className="px-4 py-3.5 tabular-nums text-neutral-700">
                  {booking.time}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      STATUS_STYLES[booking.status],
                    )}
                  >
                    {STATUS_LABELS[booking.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right sm:px-6">
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                    aria-label={`Actions for ${booking.customerName}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
