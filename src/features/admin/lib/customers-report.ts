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
};

export type CustomerSummary = {
  key: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  postcode: string | null;
  bookingCount: number;
  totalSpentCents: number;
  lastBookingAt: string;
  firstBookingAt: string;
};

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

/** Aggregate non-cancelled bookings into unique customers. */
export function aggregateCustomers(
  bookings: CustomerBookingSource[],
): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();

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

    const existing = map.get(key);
    if (existing) {
      existing.bookingCount += 1;
      existing.totalSpentCents += spend;
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
    });
  }

  return [...map.values()].sort(
    (a, b) =>
      b.lastBookingAt.localeCompare(a.lastBookingAt) ||
      (a.name ?? "").localeCompare(b.name ?? ""),
  );
}
