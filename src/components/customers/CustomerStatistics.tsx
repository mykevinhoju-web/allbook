"use client";

import { formatMoney, type CustomerStatistics } from "@/features/customers";

type CustomerStatisticsProps = {
  statistics: CustomerStatistics;
};

export function CustomerStatisticsCards({
  statistics,
}: CustomerStatisticsProps) {
  const items = [
    { label: "Total visits", value: String(statistics.completedBookings) },
    { label: "Revenue", value: formatMoney(statistics.totalSpent) },
    { label: "Avg spend", value: formatMoney(statistics.averageSpent) },
    {
      label: "Preferred staff",
      value: statistics.preferredStaffName ?? "—",
    },
    {
      label: "Favourite service",
      value: statistics.favoriteServiceName ?? "—",
    },
    {
      label: "Cancelled",
      value: String(statistics.cancelledBookings),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-neutral-200 bg-[#FAFBFC] px-4 py-3"
        >
          <p className="text-[12px] font-medium text-neutral-500">{item.label}</p>
          <p className="mt-1 truncate text-[16px] font-semibold text-neutral-950">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
