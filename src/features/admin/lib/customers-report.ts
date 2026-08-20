import {
  dateInTimeZone,
  isValidReportDate,
} from "@/features/admin/lib/revenue-report";

export type CustomerBookingSource = {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerPostcode: string | null;
  startsAt: string;
  priceCents: number;
  status: string;
  paymentStatus: string;
  staffName?: string | null;
  durationMinutes?: number | null;
};

export type CustomerVisit = {
  bookingId: string;
  startsAt: string;
  priceCents: number;
  status: string;
  staffName: string | null;
  durationMinutes: number | null;
};

export type CustomerSummary = {
  key: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  postcode: string | null;
  /** Lifetime non-cancelled visits. */
  bookingCount: number;
  /** Visits in the selected daily/monthly window (same as bookingCount for all). */
  periodVisitCount: number;
  totalSpentCents: number;
  periodSpentCents: number;
  lastBookingAt: string;
  firstBookingAt: string;
  /** Visits newest-first (lifetime for all; period for daily/monthly). */
  visits: CustomerVisit[];
  rating: "good" | "bad" | null;
  note: string;
};

export type CustomersView = "all" | "daily" | "monthly";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function customerIdentityKey(booking: {
  customerPhone: string | null;
  customerEmail: string | null;
  customerName: string | null;
}): string | null {
  const phone = booking.customerPhone?.trim();
  if (phone) return `phone:${normalizePhone(phone)}`;

  const email = booking.customerEmail?.trim().toLowerCase();
  if (email) return `email:${email}`;

  const name = booking.customerName?.trim().toLowerCase();
  if (name) return `name:${name}`;

  return null;
}

function countsTowardSpend(paymentStatus: string): boolean {
  return paymentStatus === "paid" || paymentStatus === "not_required";
}

function toVisit(booking: CustomerBookingSource): CustomerVisit {
  return {
    bookingId: booking.id,
    startsAt: booking.startsAt,
    priceCents: Math.max(0, booking.priceCents || 0),
    status: booking.status,
    staffName: booking.staffName?.trim() || null,
    durationMinutes: booking.durationMinutes ?? null,
  };
}

function localDateMatches(
  startsAt: string,
  timeZone: string,
  view: CustomersView,
  date: string | null,
  month: string | null,
): boolean {
  if (view === "all") return true;
  const localDate = dateInTimeZone(startsAt, timeZone);
  if (view === "daily") return Boolean(date && localDate === date);
  if (view === "monthly") return Boolean(month && localDate.startsWith(month));
  return true;
}

/** Aggregate non-cancelled bookings into unique customers with visit history. */
export function aggregateCustomers(
  bookings: CustomerBookingSource[],
  options?: {
    view?: CustomersView;
    timeZone?: string;
    date?: string | null;
    month?: string | null;
  },
): CustomerSummary[] {
  const view = options?.view ?? "all";
  const timeZone = options?.timeZone ?? "Australia/Sydney";
  const date = options?.date ?? null;
  const month = options?.month ?? null;

  type Acc = {
    key: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    postcode: string | null;
    bookingCount: number;
    totalSpentCents: number;
    lastBookingAt: string;
    firstBookingAt: string;
    allVisits: CustomerVisit[];
  };

  const map = new Map<string, Acc>();

  for (const booking of bookings) {
    const key = customerIdentityKey({
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
    });
    if (!key) continue;

    const spend = countsTowardSpend(booking.paymentStatus)
      ? Math.max(0, booking.priceCents || 0)
      : 0;
    const visit = toVisit(booking);
    const existing = map.get(key);

    if (existing) {
      existing.bookingCount += 1;
      existing.totalSpentCents += spend;
      existing.allVisits.push(visit);
      if (booking.startsAt > existing.lastBookingAt) {
        existing.lastBookingAt = booking.startsAt;
        if (booking.customerName?.trim()) {
          existing.name = booking.customerName.trim();
        }
        if (booking.customerPhone?.trim()) {
          existing.phone = booking.customerPhone.trim();
        }
        if (booking.customerEmail?.trim()) {
          existing.email = booking.customerEmail.trim();
        }
        if (booking.customerPostcode?.trim()) {
          existing.postcode = booking.customerPostcode.trim();
        }
      }
      if (booking.startsAt < existing.firstBookingAt) {
        existing.firstBookingAt = booking.startsAt;
      }
      continue;
    }

    map.set(key, {
      key,
      name: booking.customerName?.trim() || null,
      phone: booking.customerPhone?.trim() || null,
      email: booking.customerEmail?.trim() || null,
      postcode: booking.customerPostcode?.trim() || null,
      bookingCount: 1,
      totalSpentCents: spend,
      lastBookingAt: booking.startsAt,
      firstBookingAt: booking.startsAt,
      allVisits: [visit],
    });
  }

  const customers: CustomerSummary[] = [];

  for (const row of map.values()) {
    const allVisits = [...row.allVisits].sort((a, b) =>
      b.startsAt.localeCompare(a.startsAt),
    );
    const periodVisits =
      view === "all"
        ? allVisits
        : allVisits.filter((visit) =>
            localDateMatches(visit.startsAt, timeZone, view, date, month),
          );

    if (periodVisits.length === 0) continue;

    const periodSpentCents = periodVisits.reduce(
      (sum, visit) => sum + visit.priceCents,
      0,
    );

    customers.push({
      key: row.key,
      name: row.name,
      phone: row.phone,
      email: row.email,
      postcode: row.postcode,
      bookingCount: row.bookingCount,
      periodVisitCount: periodVisits.length,
      totalSpentCents: row.totalSpentCents,
      periodSpentCents,
      lastBookingAt: periodVisits[0]?.startsAt ?? row.lastBookingAt,
      firstBookingAt: row.firstBookingAt,
      visits: periodVisits,
      rating: null,
      note: "",
    });
  }

  return customers.sort(
    (a, b) =>
      b.lastBookingAt.localeCompare(a.lastBookingAt) ||
      (a.name ?? "").localeCompare(b.name ?? ""),
  );
}

export function isValidMonthInput(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  return isValidReportDate(`${value}-01`);
}
