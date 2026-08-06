import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { mapSalonServiceRow, toDbStatus, type SalonServiceRow } from "./map-service";
import type { SalonService, ServiceInput, ServiceStaffMember } from "./types";
import { validateServiceInput } from "./validate";

type AnySupabase = SupabaseClient<Database>;

async function loadStaffMembers(
  supabase: AnySupabase,
  salonId: string,
  staffIds: string[],
): Promise<ServiceStaffMember[]> {
  if (staffIds.length === 0) return [];
  const { data, error } = await supabase
    .from("salon_staff")
    .select("id, name, display_name")
    .eq("salon_id", salonId)
    .in("id", staffIds);
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    id: s.id,
    name: (s.display_name || s.name).trim(),
  }));
}

async function replaceStaffLinks(
  supabase: AnySupabase,
  serviceId: string,
  staffIds: string[],
) {
  const { error: delError } = await supabase
    .from("salon_staff_services")
    .delete()
    .eq("service_id", serviceId);
  if (delError) throw new Error(delError.message);

  if (staffIds.length === 0) return;

  const { error: insError } = await supabase.from("salon_staff_services").insert(
    staffIds.map((staff_id) => ({ staff_id, service_id: serviceId })),
  );
  if (insError) throw new Error(insError.message);
}

export type CreateServiceOptions = {
  supabase: AnySupabase;
  salonId: string;
  input: ServiceInput;
  existingCount?: number;
};

export async function createService(
  options: CreateServiceOptions,
): Promise<SalonService> {
  const error = validateServiceInput(options.input);
  if (error) throw new Error(error);

  const status = options.input.status ?? "active";
  const dbStatus = toDbStatus(status);
  const nextOrder =
    options.input.displayOrder ?? (options.existingCount ?? 0) + 1;
  const staffIds = options.input.staffIds ?? [];

  const { data, error: insertError } = await options.supabase
    .from("salon_services")
    .insert({
      salon_id: options.salonId,
      name: options.input.name.trim(),
      category: options.input.category,
      description: options.input.description?.trim() || null,
      duration_minutes: options.input.duration,
      price: options.input.price,
      price_max:
        options.input.priceType === "range"
          ? (options.input.priceMax ?? null)
          : null,
      price_type: options.input.priceType,
      sort_order: nextOrder,
      status: dbStatus.status,
      is_active: dbStatus.is_active,
      featured: options.input.featured ?? false,
      booking_enabled: options.input.bookingEnabled ?? true,
    })
    .select(
      "id, salon_id, category, name, description, duration_minutes, price, price_max, price_type, sort_order, is_active, booking_enabled, featured, status, created_at, updated_at",
    )
    .single();

  if (insertError || !data) {
    throw new Error(insertError?.message ?? "Could not create service.");
  }

  await replaceStaffLinks(options.supabase, data.id, staffIds);
  const staff = await loadStaffMembers(
    options.supabase,
    options.salonId,
    staffIds,
  );

  return mapSalonServiceRow(data as SalonServiceRow, staff);
}
