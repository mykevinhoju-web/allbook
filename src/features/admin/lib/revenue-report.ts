export type RevenueBookingRow = {
  id: string;
  staffId: string;
  staffName: string;
  startsAt: string;
  priceCents: number;
  staffPayoutCents: number;
  status: string;
  customerName: string | null;
  cashCents: number;
  cardCents: number;
};

export type RevenueBookingDetail = {
  id: string;
  startsAt: string;
  customerName: string | null;
  priceCents: number;
  staffPayoutCents: number;
};

export type RevenueDailyTotal = {
  date: string;
  totalCents: number;
  staffPayoutCents: number;
  shopCents: number;
  bookingCount: number;
  bookings: RevenueBookingDetail[];
};

export type RevenueStaffReport = {
  staffId: string;
  staffName: string;
  totalCents: number;
  staffPayoutCents: number;
  shopCents: number;
  cashCents: number;
  cardCents: number;
  bookingCount: number;
  daily: RevenueDailyTotal[];
};

export type RevenueReport = {
  grandTotalCents: number;
  staffPayoutTotalCents: number;
  shopTotalCents: number;
  cashTotalCents: number;
  cardTotalCents: number;
  bookingCount: number;
  byStaff: RevenueStaffReport[];
  dailyTotals: RevenueDailyTotal[];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidReportDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const check = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));
  return (
    check.getUTCFullYear() === y &&
    check.getUTCMonth() === (m ?? 1) - 1 &&
    check.getUTCDate() === d
  );
}

export function compareDateInputs(a: string, b: string): number {
  return a.localeCompare(b);
}

/** Cap inclusive range length (from..to) to keep queries bounded. */
export const MAX_REPORT_RANGE_DAYS = 93;

/** Bookings counted toward revenue (paid online or admin-created). */
export const REVENUE_ELIGIBLE_PAYMENT_STATUSES = [
  "paid",
  "not_required",
] as const;

export type RevenueEligiblePaymentStatus =
  (typeof REVENUE_ELIGIBLE_PAYMENT_STATUSES)[number];

export function inclusiveDaySpan(from: string, to: string): number {
  const start = new Date(`${from}T12:00:00Z`).getTime();
  const end = new Date(`${to}T12:00:00Z`).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

function getTimeZoneOffsetMs(timeZone: string, utcDate: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(utcDate);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const second = Number(get("second"));

  const asUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  return asUtcMs - utcDate.getTime();
}

/** Tenant-local calendar midnight → UTC ISO. */
export function zonedMidnightToUtcIso(date: string, timeZone: string): string {
  const [yearStr, monthStr, dayStr] = date.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetMs = getTimeZoneOffsetMs(timeZone, utcGuess);
  return new Date(utcGuess.getTime() - offsetMs).toISOString();
}

/** Next calendar day after YYYY-MM-DD (date-only math). */
export function nextDateInput(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

/** Inclusive from..to → half-open UTC [rangeStart, rangeEnd). */
export function reportDateRangeToUtc(
  from: string,
  to: string,
  timeZone: string,
): { rangeStart: string; rangeEnd: string } {
  return {
    rangeStart: zonedMidnightToUtcIso(from, timeZone),
    rangeEnd: zonedMidnightToUtcIso(nextDateInput(to), timeZone),
  };
}

/** Local YYYY-MM-DD for an instant in tenant timezone. */
export function dateInTimeZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Today's YYYY-MM-DD in a tenant timezone. */
export function todayDateInZone(
  timeZone: string,
  now = new Date(),
): string {
  return dateInTimeZone(now.toISOString(), timeZone);
}

function emptyDaily(date: string): RevenueDailyTotal {
  return {
    date,
    totalCents: 0,
    staffPayoutCents: 0,
    shopCents: 0,
    bookingCount: 0,
    bookings: [],
  };
}

function bumpDaily(
  map: Map<string, RevenueDailyTotal>,
  date: string,
  cents: number,
  staffPayoutCents: number,
  shopCents: number,
  booking: RevenueBookingDetail,
) {
  const row = map.get(date) ?? emptyDaily(date);
  row.totalCents += cents;
  row.staffPayoutCents += staffPayoutCents;
  row.shopCents += shopCents;
  row.bookingCount += 1;
  row.bookings.push(booking);
  map.set(date, row);
}

export function resolveStaffPayoutCents(
  snapshot: number | null | undefined,
  durationMinutes: number,
  payoutByDuration: Map<number, number>,
): number {
  if (snapshot != null) return Math.max(0, snapshot);
  return Math.max(0, payoutByDuration.get(durationMinutes) ?? 0);
}

/**
 * Aggregate booking list prices by staff and local calendar day.
 * Expects non-cancelled rows already filtered by the caller.
 */
export function aggregateRevenueReport(
  bookings: RevenueBookingRow[],
  timeZone: string,
): RevenueReport {
  const staffMap = new Map<
    string,
    {
      staffId: string;
      staffName: string;
      totalCents: number;
      staffPayoutCents: number;
      shopCents: number;
      cashCents: number;
      cardCents: number;
      bookingCount: number;
      daily: Map<string, RevenueDailyTotal>;
    }
  >();
  const dailyMap = new Map<string, RevenueDailyTotal>();

  let grandTotalCents = 0;
  let staffPayoutTotalCents = 0;
  let shopTotalCents = 0;
  let cashTotalCents = 0;
  let cardTotalCents = 0;

  for (const booking of bookings) {
    const cents = Math.max(0, booking.priceCents || 0);
    const staffPayoutCents = Math.max(0, booking.staffPayoutCents || 0);
    const shopCents = cents - staffPayoutCents;
    const cashCents = Math.max(0, booking.cashCents || 0);
    const cardCents = Math.max(0, booking.cardCents || 0);
    const date = dateInTimeZone(booking.startsAt, timeZone);
    const detail: RevenueBookingDetail = {
      id: booking.id,
      startsAt: booking.startsAt,
      customerName: booking.customerName,
      priceCents: cents,
      staffPayoutCents,
    };

    grandTotalCents += cents;
    staffPayoutTotalCents += staffPayoutCents;
    shopTotalCents += shopCents;
    cashTotalCents += cashCents;
    cardTotalCents += cardCents;
    bumpDaily(dailyMap, date, cents, staffPayoutCents, shopCents, detail);

    const existing = staffMap.get(booking.staffId);
    if (existing) {
      existing.totalCents += cents;
      existing.staffPayoutCents += staffPayoutCents;
      existing.shopCents += shopCents;
      existing.cashCents += cashCents;
      existing.cardCents += cardCents;
      existing.bookingCount += 1;
      bumpDaily(existing.daily, date, cents, staffPayoutCents, shopCents, detail);
    } else {
      const daily = new Map<string, RevenueDailyTotal>();
      bumpDaily(daily, date, cents, staffPayoutCents, shopCents, detail);
      staffMap.set(booking.staffId, {
        staffId: booking.staffId,
        staffName: booking.staffName || "Staff",
        totalCents: cents,
        staffPayoutCents,
        shopCents,
        cashCents,
        cardCents,
        bookingCount: 1,
        daily,
      });
    }
  }

  const sortDaily = (daily: RevenueDailyTotal[]): RevenueDailyTotal[] =>
    daily
      .map((row) => ({
        ...row,
        bookings: [...row.bookings].sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
      }))
      .sort((a, b) => compareDateInputs(a.date, b.date));

  const byStaff: RevenueStaffReport[] = [...staffMap.values()]
    .map((staff) => ({
      staffId: staff.staffId,
      staffName: staff.staffName,
      totalCents: staff.totalCents,
      staffPayoutCents: staff.staffPayoutCents,
      shopCents: staff.shopCents,
      cashCents: staff.cashCents,
      cardCents: staff.cardCents,
      bookingCount: staff.bookingCount,
      daily: sortDaily([...staff.daily.values()]),
    }))
    .sort(
      (a, b) =>
        b.totalCents - a.totalCents ||
        a.staffName.localeCompare(b.staffName),
    );

  const dailyTotals = sortDaily([...dailyMap.values()]);

  return {
    grandTotalCents,
    staffPayoutTotalCents,
    shopTotalCents,
    cashTotalCents,
    cardTotalCents,
    bookingCount: bookings.length,
    byStaff,
    dailyTotals,
  };
}
