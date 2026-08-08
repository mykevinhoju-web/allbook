import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveCategoryFromService } from "@/features/category";
import { parseOpeningHours } from "@/features/salon/map-salon-detail";
import type { Database } from "@/types/database";

import {
  formatAud,
  type BookingCatalogService,
  type BookingCatalogStaff,
  type BookingSalonContext,
} from "./catalog-types";

type AnySupabase = SupabaseClient<Database>;

function timeToHhMm(value: string): string {
  return value.slice(0, 5);
}

/**
 * Load live salon booking catalog from Supabase (no mocks).
 */
export async function getBookingSalonContext(
  supabase: AnySupabase,
  slug: string,
): Promise<{ context: BookingSalonContext | null; error: string | null }> {
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("*")
    .eq("slug", slug.trim())
    .maybeSingle();

  if (salonError) return { context: null, error: salonError.message };
  if (!salon) return { context: null, error: null };

  if (salon.booking_enabled !== true) {
    return {
      context: null,
      error: "Online booking is not enabled for this business.",
    };
  }

  const salonId = salon.id;

  const [servicesRes, staffRes, linksRes] = await Promise.all([
    supabase
      .from("salon_services")
      .select(
        "id, name, category, description, duration_minutes, price, is_active, status, booking_enabled",
      )
      .eq("salon_id", salonId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("salon_staff")
      .select(
        "id, name, display_name, role, position, photo_url, buffer_minutes, booking_enabled, is_active, status",
      )
      .eq("salon_id", salonId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("salon_staff_services")
      .select("staff_id, service_id"),
  ]);

  if (servicesRes.error) {
    return { context: null, error: servicesRes.error.message };
  }
  if (staffRes.error) {
    return { context: null, error: staffRes.error.message };
  }
  if (linksRes.error) {
    return { context: null, error: linksRes.error.message };
  }

  const staffRows = staffRes.data ?? [];
  const staffIds = staffRows.map((s) => s.id);

  const [hoursRes, breaksRes, leavesRes] = staffIds.length
    ? await Promise.all([
        supabase
          .from("salon_staff_working_hours")
          .select("staff_id, day_of_week, start_time, end_time, is_day_off")
          .in("staff_id", staffIds),
        supabase
          .from("salon_staff_breaks")
          .select("staff_id, day_of_week, start_time, end_time")
          .in("staff_id", staffIds),
        supabase
          .from("salon_staff_leaves")
          .select("staff_id, start_date, end_date")
          .in("staff_id", staffIds),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];

  if (hoursRes.error) return { context: null, error: hoursRes.error.message };
  if (breaksRes.error) return { context: null, error: breaksRes.error.message };
  if (leavesRes.error) return { context: null, error: leavesRes.error.message };

  const serviceIdsByStaff = new Map<string, string[]>();
  for (const link of linksRes.data ?? []) {
    const list = serviceIdsByStaff.get(link.staff_id) ?? [];
    list.push(link.service_id);
    serviceIdsByStaff.set(link.staff_id, list);
  }

  const services: BookingCatalogService[] = (servicesRes.data ?? [])
    .filter((s) => {
      const active =
        s.is_active !== false &&
        (s.status == null || s.status === "active");
      const bookingOk = s.booking_enabled !== false;
      return active && bookingOk;
    })
    .map((s) => {
      const duration = s.duration_minutes ?? 60;
      const price = s.price ?? 0;
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        duration,
        price,
        priceLabel: formatAud(price),
        description: s.description ?? "",
      };
    });

  const allServiceIds = services.map((s) => s.id);

  const staff: BookingCatalogStaff[] = staffRows
    .filter((s) => {
      const active =
        s.is_active !== false &&
        (s.status == null || s.status === "active");
      return active && s.booking_enabled !== false;
    })
    .map((s) => {
      const linked = serviceIdsByStaff.get(s.id);
      return {
        id: s.id,
        displayName: (s.display_name || s.name).trim(),
        role: (s.role || s.position || "Stylist").trim(),
        photo: s.photo_url,
        serviceIds: linked && linked.length > 0 ? linked : allServiceIds,
        bookingEnabled: s.booking_enabled !== false,
        bufferMinutes: s.buffer_minutes ?? 0,
        workingHours: (hoursRes.data ?? [])
          .filter((h) => h.staff_id === s.id)
          .map((h) => ({
            dayOfWeek: h.day_of_week,
            startTime: timeToHhMm(h.start_time),
            endTime: timeToHhMm(h.end_time),
            isDayOff: h.is_day_off,
          })),
        breaks: (breaksRes.data ?? [])
          .filter((b) => b.staff_id === s.id)
          .map((b) => ({
            dayOfWeek: b.day_of_week,
            startTime: timeToHhMm(b.start_time),
            endTime: timeToHhMm(b.end_time),
          })),
        leaves: (leavesRes.data ?? [])
          .filter((l) => l.staff_id === s.id)
          .map((l) => ({
            startDate: l.start_date,
            endDate: l.end_date,
          })),
      };
    });

  const category =
    resolveCategoryFromService(salon.primary_service) ??
    resolveCategoryFromService("Hair");

  return {
    context: {
      salonId,
      salonName: salon.name,
      slug: salon.slug,
      categorySlug: category?.slug ?? "hair",
      openingHours: parseOpeningHours(salon.opening_hours),
      services,
      staff,
      seedBookingsByStaffDate: {},
    },
    error: null,
  };
}
