import { computeScheduleGridWindow } from "../src/features/booking/lib/schedule-grid-utils";
import type { StaffRecord } from "../src/features/staff/types";

// Production-only verification (no auth required for admin API on this app).
// Checks whether overnight bookings are included when querying by
// shift-window (from/to) rather than calendar day (date).

const BASE = "https://dayspa.allbook.com.au";
const DATE = "2026-07-08";
const TIME_ZONE = "Australia/Sydney";

type ApiStaffRecord = Pick<
  StaffRecord,
  "id" | "status" | "attributes" | "shiftStartsAt" | "shiftEndsAt"
>;

type AdminBooking = {
  id: string;
  startsAt: string;
  endsAt: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${url}`);
  }
  return (await res.json()) as T;
}

void (async () => {
  const staffData = await fetchJson<{ staff?: ApiStaffRecord[] }>(
    `${BASE}/api/admin/staff`,
  );
  const staff = (staffData.staff ?? []) as StaffRecord[];

  const window = computeScheduleGridWindow(staff, DATE, TIME_ZONE, new Date());
  if (!window) {
    console.log("No schedule grid window computed.");
    process.exit(0);
  }

  const fromIso = new Date(window.startMs).toISOString();
  const toIso = new Date(window.endMs).toISOString();

  const dateBookings = await fetchJson<{ bookings?: AdminBooking[] }>(
    `${BASE}/api/admin/bookings?date=${DATE}`,
  );
  const rangeBookings = await fetchJson<{ bookings?: AdminBooking[] }>(
    `${BASE}/api/admin/bookings?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
  );

  const dateSet = new Set((dateBookings.bookings ?? []).map((b) => b.id));
  const missing = (rangeBookings.bookings ?? []).filter(
    (b) => !dateSet.has(b.id),
  );

  console.log("verify-admin-overnight-display");
  console.log({ DATE, fromIso, toIso });
  console.log({
    countDate: dateBookings.bookings?.length ?? 0,
    countRange: rangeBookings.bookings?.length ?? 0,
    missingCount: missing.length,
  });

  console.log(
    "First missing bookings:",
    missing.slice(0, 5).map((b) => ({
      id: b.id,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
    })),
  );
})();

