import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { mapSalonServiceRow, type SalonServiceRow } from "./map-service";
import type {
  SalonService,
  ServiceListQuery,
  ServiceStaffMember,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

/**
 * List services for one salon from `salon_services` (no mocks).
 */
export async function getServices(
  supabase: AnySupabase,
  query: ServiceListQuery,
): Promise<SalonService[]> {
  let q = supabase
    .from("salon_services")
    .select(
      "id, salon_id, category, name, description, duration_minutes, price, price_max, price_type, sort_order, is_active, booking_enabled, featured, status, created_at, updated_at",
    )
    .eq("salon_id", query.salonId)
    .order("sort_order", { ascending: true });

  if (!query.includeArchived) {
    q = q.neq("status", "archived");
  }
  if (query.category && query.category !== "all") {
    q = q.eq("category", query.category);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as SalonServiceRow[];
  if (rows.length === 0) return [];

  const serviceIds = rows.map((r) => r.id);
  const { data: links, error: linkError } = await supabase
    .from("salon_staff_services")
    .select("service_id, staff_id")
    .in("service_id", serviceIds);

  if (linkError) throw new Error(linkError.message);

  const staffIds = [
    ...new Set((links ?? []).map((l) => l.staff_id)),
  ];

  let staffById = new Map<string, ServiceStaffMember>();
  if (staffIds.length > 0) {
    const { data: staffRows, error: staffError } = await supabase
      .from("salon_staff")
      .select("id, name, display_name")
      .eq("salon_id", query.salonId)
      .in("id", staffIds);

    if (staffError) throw new Error(staffError.message);
    staffById = new Map(
      (staffRows ?? []).map((s) => [
        s.id,
        {
          id: s.id,
          name: (s.display_name || s.name).trim(),
        },
      ]),
    );
  }

  const staffIdsByService = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = staffIdsByService.get(link.service_id) ?? [];
    list.push(link.staff_id);
    staffIdsByService.set(link.service_id, list);
  }

  let services = rows.map((row) => {
    const ids = staffIdsByService.get(row.id) ?? [];
    const staff = ids
      .map((id) => staffById.get(id))
      .filter((s): s is ServiceStaffMember => Boolean(s));
    return mapSalonServiceRow(row, staff);
  });

  if (query.search?.trim()) {
    const qText = query.search.trim().toLowerCase();
    services = services.filter(
      (s) =>
        s.name.toLowerCase().includes(qText) ||
        s.category.toLowerCase().includes(qText) ||
        String(s.price).includes(qText) ||
        `$${s.price}`.includes(qText),
    );
  }

  return services;
}

/** Active staff options for service assignment (owned salon only). */
export async function getServiceStaffOptions(
  supabase: AnySupabase,
  salonId: string,
): Promise<ServiceStaffMember[]> {
  const { data, error } = await supabase
    .from("salon_staff")
    .select("id, name, display_name")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((s) => ({
    id: s.id,
    name: (s.display_name || s.name).trim(),
  }));
}

export function getServiceDurationMinutes(service: SalonService): number {
  return service.duration;
}
