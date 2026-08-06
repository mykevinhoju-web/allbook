import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { createService } from "./createService";
import { mapSalonServiceRow, toDbStatus, type SalonServiceRow } from "./map-service";
import type {
  SalonService,
  ServiceInput,
  ServiceStaffMember,
  ServiceStatus,
} from "./types";
import { validateServiceInput } from "./validate";

type AnySupabase = SupabaseClient<Database>;

export type UpdateServicePatch = Partial<ServiceInput> & {
  status?: ServiceStatus;
};

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

export async function updateService(
  supabase: AnySupabase,
  service: SalonService,
  patch: UpdateServicePatch,
): Promise<SalonService> {
  const nextInput: ServiceInput = {
    name: patch.name ?? service.name,
    category: patch.category ?? service.category,
    description: patch.description ?? service.description,
    duration: patch.duration ?? service.duration,
    price: patch.price ?? service.price,
    priceMax: patch.priceMax !== undefined ? patch.priceMax : service.priceMax,
    priceType: patch.priceType ?? service.priceType,
    staffIds: patch.staffIds ?? service.staffIds,
    displayOrder: patch.displayOrder ?? service.displayOrder,
    status: patch.status ?? service.status,
    featured: patch.featured ?? service.featured,
    bookingEnabled: patch.bookingEnabled ?? service.bookingEnabled,
  };

  const error = validateServiceInput(nextInput);
  if (error) throw new Error(error);

  const dbStatus = toDbStatus(nextInput.status ?? service.status);
  const staffIds = nextInput.staffIds;

  const { data, error: updateError } = await supabase
    .from("salon_services")
    .update({
      name: nextInput.name.trim(),
      category: nextInput.category,
      description: nextInput.description?.trim() || null,
      duration_minutes: nextInput.duration,
      price: nextInput.price,
      price_max:
        nextInput.priceType === "range" ? (nextInput.priceMax ?? null) : null,
      price_type: nextInput.priceType,
      sort_order: nextInput.displayOrder ?? service.displayOrder,
      status: dbStatus.status,
      is_active: dbStatus.is_active,
      featured: nextInput.featured ?? false,
      booking_enabled: nextInput.bookingEnabled ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", service.id)
    .eq("salon_id", service.salonId)
    .select(
      "id, salon_id, category, name, description, duration_minutes, price, price_max, price_type, sort_order, is_active, booking_enabled, featured, status, created_at, updated_at",
    )
    .single();

  if (updateError || !data) {
    throw new Error(updateError?.message ?? "Could not update service.");
  }

  if (patch.staffIds) {
    await replaceStaffLinks(supabase, service.id, staffIds);
  }

  const staff = await loadStaffMembers(supabase, service.salonId, staffIds);
  return mapSalonServiceRow(data as SalonServiceRow, staff);
}

export async function duplicateService(
  supabase: AnySupabase,
  service: SalonService,
): Promise<SalonService> {
  return createService({
    supabase,
    salonId: service.salonId,
    existingCount: service.displayOrder,
    input: {
      name: `${service.name} (Copy)`,
      category: service.category,
      description: service.description,
      duration: service.duration,
      price: service.price,
      priceMax: service.priceMax,
      priceType: service.priceType,
      staffIds: service.staffIds,
      displayOrder: service.displayOrder + 1,
      status: service.status === "archived" ? "inactive" : service.status,
      featured: false,
      bookingEnabled: service.bookingEnabled,
    },
  });
}

export async function archiveService(
  supabase: AnySupabase,
  service: SalonService,
): Promise<SalonService> {
  return updateService(supabase, service, {
    status: "archived",
    bookingEnabled: false,
  });
}

export async function restoreService(
  supabase: AnySupabase,
  service: SalonService,
): Promise<SalonService> {
  return updateService(supabase, service, {
    status: "active",
    bookingEnabled: true,
  });
}
