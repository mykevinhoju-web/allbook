import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  mapBreaks,
  mapLeaves,
  mapStaffRow,
  mapWorkingHours,
  type StaffRow,
} from "./map-staff";
import type {
  SalonStaffMember,
  StaffAssignedService,
  StaffListQuery,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

/**
 * Live staff for one salon — includes hours, breaks, leave, services.
 */
export async function getStaff(
  supabase: AnySupabase,
  query: StaffListQuery,
): Promise<SalonStaffMember[]> {
  let q = supabase
    .from("salon_staff")
    .select("*")
    .eq("salon_id", query.salonId)
    .order("sort_order", { ascending: true });

  if (!query.includeArchived) {
    q = q.neq("status", "archived");
  }
  if (query.role && query.role !== "all") {
    q = q.eq("role", query.role);
  }
  if (query.status && query.status !== "all") {
    q = q.eq("status", query.status);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as StaffRow[];
  if (rows.length === 0) return [];

  const staffIds = rows.map((r) => r.id);

  const [hoursRes, breaksRes, leavesRes, linksRes] = await Promise.all([
    supabase
      .from("salon_staff_working_hours")
      .select("staff_id, day_of_week, start_time, end_time, is_day_off")
      .in("staff_id", staffIds),
    supabase
      .from("salon_staff_breaks")
      .select("id, staff_id, day_of_week, start_time, end_time, break_type, label")
      .in("staff_id", staffIds),
    supabase
      .from("salon_staff_leaves")
      .select("id, staff_id, start_date, end_date, leave_type, reason")
      .in("staff_id", staffIds),
    supabase
      .from("salon_staff_services")
      .select("staff_id, service_id")
      .in("staff_id", staffIds),
  ]);

  if (hoursRes.error) throw new Error(hoursRes.error.message);
  if (breaksRes.error) throw new Error(breaksRes.error.message);
  if (leavesRes.error) throw new Error(leavesRes.error.message);
  if (linksRes.error) throw new Error(linksRes.error.message);

  const serviceIds = [
    ...new Set((linksRes.data ?? []).map((l) => l.service_id)),
  ];

  let servicesById = new Map<string, StaffAssignedService>();
  if (serviceIds.length > 0) {
    const { data: services, error: servicesError } = await supabase
      .from("salon_services")
      .select("id, name, category")
      .eq("salon_id", query.salonId)
      .in("id", serviceIds);
    if (servicesError) throw new Error(servicesError.message);
    servicesById = new Map(
      (services ?? []).map((s) => [
        s.id,
        { id: s.id, name: s.name, category: s.category },
      ]),
    );
  }

  let members = rows.map((row) => {
    const hours = (hoursRes.data ?? []).filter((h) => h.staff_id === row.id);
    const breaks = (breaksRes.data ?? []).filter((b) => b.staff_id === row.id);
    const leaves = (leavesRes.data ?? []).filter((l) => l.staff_id === row.id);
    const linked = (linksRes.data ?? [])
      .filter((l) => l.staff_id === row.id)
      .map((l) => servicesById.get(l.service_id))
      .filter((s): s is StaffAssignedService => Boolean(s));

    return mapStaffRow(row, {
      workingHours: mapWorkingHours(hours),
      breaks: mapBreaks(breaks),
      leaves: mapLeaves(leaves),
      services: linked,
    });
  });

  if (query.search?.trim()) {
    const qText = query.search.trim().toLowerCase();
    members = members.filter(
      (s) =>
        s.displayName.toLowerCase().includes(qText) ||
        s.firstName.toLowerCase().includes(qText) ||
        s.lastName.toLowerCase().includes(qText) ||
        s.role.toLowerCase().includes(qText) ||
        s.specialties.some((sp) => sp.toLowerCase().includes(qText)) ||
        s.languages.some((l) => l.toLowerCase().includes(qText)),
    );
  }

  return members.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "en"),
  );
}

/** Active (non-archived) services for assignment. */
export async function getAssignableServices(
  supabase: AnySupabase,
  salonId: string,
): Promise<StaffAssignedService[]> {
  const { data, error } = await supabase
    .from("salon_services")
    .select("id, name, category")
    .eq("salon_id", salonId)
    .neq("status", "archived")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
  }));
}

export function getBookableStaff(
  staff: SalonStaffMember[],
): SalonStaffMember[] {
  return staff.filter((s) => s.status === "active" && s.bookingEnabled);
}
