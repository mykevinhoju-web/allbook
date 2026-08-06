import type { CustomerStatus, CustomerTag } from "./types";

export const CUSTOMER_STATUSES: { id: CustomerStatus; label: string }[] = [
  { id: "vip", label: "VIP" },
  { id: "regular", label: "Regular" },
  { id: "inactive", label: "Inactive" },
  { id: "blocked", label: "Blocked" },
];

export const CUSTOMER_TAGS: CustomerTag[] = [
  "VIP",
  "Student",
  "Senior",
  "Colour Client",
  "Weekly Client",
  "Monthly Client",
];

export function customerFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateLabel(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function exportCustomersToCsv(
  rows: Array<{
    fullName: string;
    phone: string;
    email: string;
    status: string;
    totalVisits: number;
    totalSpent: number;
    lastVisit: string | null;
    nextBooking: string | null;
    tags: string[];
  }>,
): string {
  const header = [
    "Name",
    "Phone",
    "Email",
    "Status",
    "Total Visits",
    "Total Spent",
    "Last Visit",
    "Next Booking",
    "Tags",
  ];

  const escape = (value: string | number) => {
    const raw = String(value ?? "");
    if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
  };

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.fullName,
        row.phone,
        row.email,
        row.status,
        row.totalVisits,
        row.totalSpent,
        row.lastVisit ?? "",
        row.nextBooking ?? "",
        row.tags.join("; "),
      ]
        .map(escape)
        .join(","),
    ),
  ];

  return lines.join("\n");
}
