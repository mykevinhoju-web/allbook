"use client";

import {
  formatDateLabel,
  formatMoney,
  type SalonCustomer,
  type CustomerStatus,
} from "@/features/customers";
import { cn } from "@/lib/utils";

type CustomerTableProps = {
  customers: SalonCustomer[];
  selectedId: string | null;
  onSelect: (customer: SalonCustomer) => void;
};

const STATUS_STYLES: Record<CustomerStatus, string> = {
  vip: "bg-amber-50 text-amber-800",
  regular: "bg-emerald-50 text-emerald-700",
  inactive: "bg-neutral-100 text-neutral-600",
  blocked: "bg-rose-50 text-rose-700",
};

export function CustomerTable({
  customers,
  selectedId,
  onSelect,
}: CustomerTableProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[13px]">
          <thead className="bg-[#FAFBFC] text-[11px] uppercase tracking-[0.08em] text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">Contact</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Bookings</th>
              <th className="px-3 py-3 font-semibold">Spent</th>
              <th className="px-3 py-3 font-semibold">Last booking</th>
              <th className="px-5 py-3 font-semibold">Next booking</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const active = selectedId === customer.id;
              return (
                <tr
                  key={customer.id}
                  onClick={() => onSelect(customer)}
                  className={cn(
                    "cursor-pointer border-t border-neutral-100 transition",
                    active ? "bg-neutral-950/5" : "hover:bg-[#FAFBFC]",
                  )}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.fullName} avatar={customer.avatar} />
                      <div>
                        <p className="font-medium text-neutral-900">
                          {customer.fullName}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {customer.tags.join(" · ") || "No tags"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-neutral-600">
                    <p>{customer.phone || "—"}</p>
                    <p className="text-[11px] text-neutral-400">
                      {customer.email || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                        STATUS_STYLES[customer.status],
                      )}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-neutral-700">
                    {customer.statistics.totalBookings}
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-neutral-700">
                    {formatMoney(customer.statistics.totalSpent)}
                  </td>
                  <td className="px-3 py-3.5 text-neutral-600">
                    {formatDateLabel(customer.statistics.lastVisit)}
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600">
                    {formatDateLabel(customer.statistics.nextBooking)}
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-16 text-center text-[14px] text-neutral-500"
                >
                  No customers match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar} alt="" className="size-9 rounded-xl object-cover" />
    );
  }
  return (
    <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-950 text-[11px] font-semibold text-white">
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")}
    </div>
  );
}
