import type {
  BookingCustomerSyncInput,
  SalonCustomer,
  CustomerTimelineEvent,
} from "./types";
import { customerFullName } from "./constants";

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "Guest",
    lastName: parts.slice(1).join(" ") || "",
  };
}

/**
 * Upsert customer profile from a booking payload.
 * Called by the booking engine — not from UI.
 */
export function upsertCustomerFromBooking(
  customers: SalonCustomer[],
  input: BookingCustomerSyncInput,
): { customers: SalonCustomer[]; customer: SalonCustomer } {
  const phone = input.customerPhone?.trim() ?? "";
  const email = input.customerEmail?.trim().toLowerCase() ?? "";

  let existing =
    (input.customerId
      ? customers.find((c) => c.id === input.customerId)
      : undefined) ??
    customers.find(
      (c) =>
        c.salonId === input.salonId &&
        ((phone && c.phone.replace(/\s/g, "") === phone.replace(/\s/g, "")) ||
          (email && c.email.toLowerCase() === email)),
    );

  const names = splitName(input.customerName);
  const now = new Date().toISOString();

  if (!existing) {
    const id = `cust_${crypto.randomUUID().slice(0, 8)}`;
    existing = {
      id,
      salonId: input.salonId,
      firstName: names.firstName,
      lastName: names.lastName,
      fullName: customerFullName(names.firstName, names.lastName),
      phone,
      email,
      birthday: null,
      gender: null,
      avatar: null,
      status: "regular",
      joinedAt: now,
      updatedAt: now,
      tags: [],
      loyaltyPoints: 0,
      statistics: {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalSpent: 0,
        averageSpent: 0,
        lastVisit: null,
        nextBooking: null,
        preferredStaffId: null,
        preferredStaffName: null,
        favoriteServiceId: null,
        favoriteServiceName: null,
      },
      notes: [],
      timeline: [],
      media: [],
      bookingHistory: [],
      upcomingBookings: [],
      cancelledBookings: [],
      favouriteServices: [],
    };
  } else {
    existing = {
      ...existing,
      phone: phone || existing.phone,
      email: email || existing.email,
      firstName: names.firstName || existing.firstName,
      lastName: names.lastName || existing.lastName,
      fullName: customerFullName(
        names.firstName || existing.firstName,
        names.lastName || existing.lastName,
      ),
      updatedAt: now,
    };
  }

  const updated = applyBookingToCustomerStats(existing, input);
  const without = customers.filter((c) => c.id !== updated.id);
  return { customers: [...without, updated], customer: updated };
}

/**
 * Every completed (or cancelled/created) booking updates CRM statistics + timeline.
 */
export function applyBookingToCustomerStats(
  customer: SalonCustomer,
  input: BookingCustomerSyncInput,
): SalonCustomer {
  const stats = { ...customer.statistics };
  const timeline: CustomerTimelineEvent[] = [...customer.timeline];
  const now = new Date().toISOString();

  const bookingRow = {
    id: input.bookingId,
    serviceName: input.serviceName,
    staffName: input.staffName,
    bookingDate: input.bookingDate,
    startTime: "00:00",
    status: input.status,
    amount: input.amount,
  };

  let bookingHistory = customer.bookingHistory.filter(
    (b) => b.id !== input.bookingId,
  );
  let upcoming = customer.upcomingBookings.filter(
    (b) => b.id !== input.bookingId,
  );
  let cancelled = customer.cancelledBookings.filter(
    (b) => b.id !== input.bookingId,
  );

  if (input.status === "cancelled" || input.status === "no_show") {
    stats.cancelledBookings += 1;
    stats.totalBookings += 1;
    cancelled = [bookingRow, ...cancelled];
    timeline.unshift({
      id: `tl_${crypto.randomUUID().slice(0, 8)}`,
      customerId: customer.id,
      eventType: "booking_cancelled",
      title: "Booking cancelled",
      detail: `${input.serviceName} with ${input.staffName}`,
      bookingId: input.bookingId,
      createdAt: now,
    });
  } else if (input.status === "completed") {
    stats.completedBookings += 1;
    stats.totalBookings += 1;
    stats.totalSpent += input.amount;
    stats.averageSpent =
      stats.completedBookings > 0
        ? Math.round(stats.totalSpent / stats.completedBookings)
        : 0;
    stats.lastVisit = input.bookingDate;
    stats.preferredStaffId = input.staffId;
    stats.preferredStaffName = input.staffName;
    stats.favoriteServiceId = input.serviceId;
    stats.favoriteServiceName = input.serviceName;
    bookingHistory = [bookingRow, ...bookingHistory];
    timeline.unshift(
      {
        id: `tl_${crypto.randomUUID().slice(0, 8)}`,
        customerId: customer.id,
        eventType: "booking_completed",
        title: "Booking completed",
        detail: `${input.serviceName} with ${input.staffName}`,
        bookingId: input.bookingId,
        createdAt: now,
      },
      {
        id: `tl_${crypto.randomUUID().slice(0, 8)}`,
        customerId: customer.id,
        eventType: "payment_completed",
        title: "Payment completed",
        detail: `$${input.amount}`,
        bookingId: input.bookingId,
        createdAt: now,
      },
    );
  } else {
    // pending / confirmed
    stats.totalBookings += 1;
    upcoming = [bookingRow, ...upcoming];
    const nextDates = upcoming
      .map((b) => b.bookingDate)
      .sort();
    stats.nextBooking = nextDates[0] ?? stats.nextBooking;
    timeline.unshift({
      id: `tl_${crypto.randomUUID().slice(0, 8)}`,
      customerId: customer.id,
      eventType: "booking_created",
      title: "Booking created",
      detail: `${input.serviceName} with ${input.staffName}`,
      bookingId: input.bookingId,
      createdAt: now,
    });
  }

  const favouriteServices = Array.from(
    new Set([
      input.serviceName,
      ...customer.favouriteServices,
    ]),
  ).slice(0, 8);

  return {
    ...customer,
    statistics: stats,
    timeline,
    bookingHistory,
    upcomingBookings: upcoming,
    cancelledBookings: cancelled,
    favouriteServices,
    updatedAt: now,
  };
}
