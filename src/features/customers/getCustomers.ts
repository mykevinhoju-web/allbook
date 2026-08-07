import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  emptyStatistics,
  hhmm,
  mapCustomerRow,
  mapCustomerTags,
  type CustomerRow,
} from "./map-customer";
import type {
  CustomerBookingSummary,
  CustomerListQuery,
  CustomerMedia,
  CustomerNote,
  CustomerStatistics,
  CustomerTimelineEvent,
  SalonCustomer,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

type BookingRow = {
  id: string;
  customer_id: string | null;
  staff_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  status: string;
};

type StatsRow = {
  customer_id: string;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_spent: number;
  average_spent: number;
  last_visit: string | null;
  next_booking: string | null;
  preferred_staff_id: string | null;
  favorite_service_id: string | null;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildBookingSummaries(
  bookings: BookingRow[],
  staffNames: Map<string, string>,
  serviceMeta: Map<string, { name: string; price: number }>,
): {
  history: CustomerBookingSummary[];
  upcoming: CustomerBookingSummary[];
  cancelled: CustomerBookingSummary[];
  favouriteServices: string[];
  computedStats: CustomerStatistics;
} {
  const today = todayIso();
  const history: CustomerBookingSummary[] = [];
  const upcoming: CustomerBookingSummary[] = [];
  const cancelled: CustomerBookingSummary[] = [];
  const serviceCounts = new Map<string, number>();

  let completedBookings = 0;
  let cancelledBookings = 0;
  let totalSpent = 0;
  let lastVisit: string | null = null;
  let nextBooking: string | null = null;
  const staffCounts = new Map<string, number>();

  const sorted = [...bookings].sort((a, b) => {
    const byDate = b.booking_date.localeCompare(a.booking_date);
    if (byDate !== 0) return byDate;
    return b.start_time.localeCompare(a.start_time);
  });

  for (const b of sorted) {
    const service = serviceMeta.get(b.service_id);
    const amount = service?.price ?? 0;
    const summary: CustomerBookingSummary = {
      id: b.id,
      serviceName: service?.name ?? "Service",
      staffName: staffNames.get(b.staff_id) ?? "Staff",
      bookingDate: b.booking_date,
      startTime: hhmm(b.start_time),
      status: b.status,
      amount,
    };

    if (b.status === "cancelled" || b.status === "no_show") {
      cancelledBookings += 1;
      cancelled.push(summary);
    } else if (
      (b.status === "pending" || b.status === "confirmed") &&
      b.booking_date >= today
    ) {
      upcoming.push(summary);
      if (!nextBooking || b.booking_date < nextBooking) {
        nextBooking = b.booking_date;
      }
    } else {
      history.push(summary);
    }

    if (b.status === "completed") {
      completedBookings += 1;
      totalSpent += amount;
      if (!lastVisit || b.booking_date > lastVisit) lastVisit = b.booking_date;
      serviceCounts.set(
        b.service_id,
        (serviceCounts.get(b.service_id) ?? 0) + 1,
      );
      staffCounts.set(b.staff_id, (staffCounts.get(b.staff_id) ?? 0) + 1);
    }
  }

  let favoriteServiceId: string | null = null;
  let favoriteServiceName: string | null = null;
  let maxService = 0;
  for (const [id, count] of serviceCounts) {
    if (count > maxService) {
      maxService = count;
      favoriteServiceId = id;
      favoriteServiceName = serviceMeta.get(id)?.name ?? null;
    }
  }

  let preferredStaffId: string | null = null;
  let preferredStaffName: string | null = null;
  let maxStaff = 0;
  for (const [id, count] of staffCounts) {
    if (count > maxStaff) {
      maxStaff = count;
      preferredStaffId = id;
      preferredStaffName = staffNames.get(id) ?? null;
    }
  }

  const favouriteServices = [...serviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => serviceMeta.get(id)?.name)
    .filter((n): n is string => Boolean(n));

  return {
    history,
    upcoming: upcoming.sort((a, b) =>
      a.bookingDate.localeCompare(b.bookingDate),
    ),
    cancelled,
    favouriteServices,
    computedStats: emptyStatistics({
      totalBookings: bookings.length,
      completedBookings,
      cancelledBookings,
      totalSpent,
      averageSpent:
        completedBookings > 0
          ? Math.round((totalSpent / completedBookings) * 100) / 100
          : 0,
      lastVisit,
      nextBooking,
      preferredStaffId,
      preferredStaffName,
      favoriteServiceId,
      favoriteServiceName,
    }),
  };
}

/**
 * Live customers for one salon — notes, tags, bookings, stats.
 * Uses service role when notes/tags lack owner SELECT RLS.
 */
export async function getCustomers(
  supabase: AnySupabase,
  query: CustomerListQuery,
): Promise<SalonCustomer[]> {
  let q = supabase
    .from("salon_customers")
    .select("*")
    .eq("salon_id", query.salonId)
    .order("created_at", { ascending: false });

  if (query.status && query.status !== "all") {
    q = q.eq("status", query.status);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CustomerRow[];
  if (rows.length === 0) return [];

  const customerIds = rows.map((r) => r.id);

  const [
    notesRes,
    tagsRes,
    statsRes,
    timelineRes,
    mediaRes,
    bookingsRes,
  ] = await Promise.all([
    supabase
      .from("salon_customer_notes")
      .select("id, customer_id, staff_id, note, created_at")
      .in("customer_id", customerIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("salon_customer_tags")
      .select("customer_id, tag")
      .in("customer_id", customerIds),
    supabase
      .from("salon_customer_statistics")
      .select("*")
      .in("customer_id", customerIds),
    supabase
      .from("salon_customer_timeline")
      .select(
        "id, customer_id, event_type, title, detail, booking_id, created_at",
      )
      .in("customer_id", customerIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("salon_customer_media")
      .select("id, customer_id, url, media_type, caption, created_at")
      .in("customer_id", customerIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("salon_bookings")
      .select(
        "id, customer_id, staff_id, service_id, booking_date, start_time, status",
      )
      .eq("salon_id", query.salonId)
      .in("customer_id", customerIds),
  ]);

  if (notesRes.error) throw new Error(notesRes.error.message);
  if (tagsRes.error) throw new Error(tagsRes.error.message);
  if (statsRes.error) throw new Error(statsRes.error.message);
  if (timelineRes.error) throw new Error(timelineRes.error.message);
  if (mediaRes.error) throw new Error(mediaRes.error.message);
  if (bookingsRes.error) throw new Error(bookingsRes.error.message);

  const bookings = (bookingsRes.data ?? []) as BookingRow[];
  const staffIds = [
    ...new Set([
      ...bookings.map((b) => b.staff_id),
      ...rows
        .map((r) => r.preferred_staff_id)
        .filter((id): id is string => Boolean(id)),
      ...(notesRes.data ?? [])
        .map((n) => n.staff_id)
        .filter((id): id is string => Boolean(id)),
      ...(statsRes.data ?? [])
        .map((s) => s.preferred_staff_id)
        .filter((id): id is string => Boolean(id)),
    ]),
  ];
  const serviceIds = [...new Set(bookings.map((b) => b.service_id))];

  const staffNames = new Map<string, string>();
  if (staffIds.length > 0) {
    const { data: staffRows, error: staffError } = await supabase
      .from("salon_staff")
      .select("id, name, display_name")
      .eq("salon_id", query.salonId)
      .in("id", staffIds);
    if (staffError) throw new Error(staffError.message);
    for (const s of staffRows ?? []) {
      staffNames.set(s.id, (s.display_name || s.name).trim());
    }
  }

  const serviceMeta = new Map<string, { name: string; price: number }>();
  if (serviceIds.length > 0) {
    const { data: serviceRows, error: serviceError } = await supabase
      .from("salon_services")
      .select("id, name, price")
      .eq("salon_id", query.salonId)
      .in("id", serviceIds);
    if (serviceError) throw new Error(serviceError.message);
    for (const s of serviceRows ?? []) {
      serviceMeta.set(s.id, { name: s.name, price: s.price });
    }
  }

  const serviceNames = new Map(
    [...serviceMeta.entries()].map(([id, meta]) => [id, meta.name]),
  );

  let customers = rows.map((row) => {
    const customerBookings = bookings.filter((b) => b.customer_id === row.id);
    const bookingExtras = buildBookingSummaries(
      customerBookings,
      staffNames,
      serviceMeta,
    );
    const statsRow = (statsRes.data ?? []).find(
      (s) => s.customer_id === row.id,
    ) as StatsRow | undefined;

    const preferredStaffId =
      statsRow?.preferred_staff_id ??
      bookingExtras.computedStats.preferredStaffId ??
      row.preferred_staff_id;
    const favoriteServiceId =
      statsRow?.favorite_service_id ??
      bookingExtras.computedStats.favoriteServiceId;

    // Prefer stored CRM stats when present; otherwise compute from bookings.
    // Spend uses stored total_spent when > 0, else completed service prices
    // (marketplace has no salon payments table yet).
    const storedSpent = Number(statsRow?.total_spent ?? 0);
    const totalSpent =
      storedSpent > 0 ? storedSpent : bookingExtras.computedStats.totalSpent;
    const completed =
      statsRow?.completed_bookings ??
      bookingExtras.computedStats.completedBookings;
    const averageSpent =
      statsRow && Number(statsRow.average_spent) > 0
        ? Number(statsRow.average_spent)
        : bookingExtras.computedStats.averageSpent;

    const statistics = emptyStatistics({
      totalBookings:
        statsRow?.total_bookings ?? bookingExtras.computedStats.totalBookings,
      completedBookings: completed,
      cancelledBookings:
        statsRow?.cancelled_bookings ??
        bookingExtras.computedStats.cancelledBookings,
      totalSpent,
      averageSpent,
      lastVisit:
        statsRow?.last_visit ?? bookingExtras.computedStats.lastVisit,
      nextBooking:
        statsRow?.next_booking ?? bookingExtras.computedStats.nextBooking,
      preferredStaffId,
      preferredStaffName: preferredStaffId
        ? (staffNames.get(preferredStaffId) ?? null)
        : null,
      favoriteServiceId,
      favoriteServiceName: favoriteServiceId
        ? (serviceNames.get(favoriteServiceId) ??
          bookingExtras.computedStats.favoriteServiceName)
        : null,
    });

    const notes: CustomerNote[] = (notesRes.data ?? [])
      .filter((n) => n.customer_id === row.id)
      .map((n) => ({
        id: n.id,
        customerId: n.customer_id,
        staffId: n.staff_id,
        staffName: n.staff_id ? (staffNames.get(n.staff_id) ?? null) : null,
        note: n.note,
        createdAt: n.created_at,
      }));

    const tags = mapCustomerTags(
      (tagsRes.data ?? [])
        .filter((t) => t.customer_id === row.id)
        .map((t) => t.tag),
    );

    const timeline: CustomerTimelineEvent[] = (timelineRes.data ?? [])
      .filter((t) => t.customer_id === row.id)
      .map((t) => ({
        id: t.id,
        customerId: t.customer_id,
        eventType: t.event_type,
        title: t.title,
        detail: t.detail,
        bookingId: t.booking_id,
        createdAt: t.created_at,
      }));

    const media: CustomerMedia[] = (mediaRes.data ?? [])
      .filter((m) => m.customer_id === row.id)
      .map((m) => ({
        id: m.id,
        url: m.url,
        mediaType: m.media_type,
        caption: m.caption,
        createdAt: m.created_at,
      }));

    return mapCustomerRow(row, {
      tags,
      statistics,
      notes,
      timeline,
      media,
      bookingHistory: bookingExtras.history,
      upcomingBookings: bookingExtras.upcoming,
      cancelledBookings: bookingExtras.cancelled,
      favouriteServices: bookingExtras.favouriteServices,
    });
  });

  if (query.tag && query.tag !== "all") {
    const tag = query.tag;
    customers = customers.filter((c) => c.tags.includes(tag));
  }

  if (query.search?.trim()) {
    const qText = query.search.trim().toLowerCase();
    const qPhone = qText.replace(/\s/g, "");
    customers = customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(qText) ||
        c.email.toLowerCase().includes(qText) ||
        c.phone.replace(/\s/g, "").includes(qPhone),
    );
  }

  const sort = query.sort ?? "name";
  const dir = query.sortDir === "desc" ? -1 : 1;
  customers = [...customers].sort((a, b) => {
    if (sort === "last_visit") {
      return (
        dir *
        ((a.statistics.lastVisit ?? "").localeCompare(
          b.statistics.lastVisit ?? "",
        ))
      );
    }
    if (sort === "total_spent") {
      return dir * (a.statistics.totalSpent - b.statistics.totalSpent);
    }
    if (sort === "joined") {
      return dir * a.joinedAt.localeCompare(b.joinedAt);
    }
    return dir * a.fullName.localeCompare(b.fullName, "en");
  });

  return customers;
}

export async function getCustomer(
  supabase: AnySupabase,
  salonId: string,
  customerId: string,
): Promise<SalonCustomer | null> {
  const customers = await getCustomers(supabase, { salonId });
  return customers.find((c) => c.id === customerId) ?? null;
}
