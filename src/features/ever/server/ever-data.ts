import { createServiceSupabase } from "@/lib/admin/tenant-context";

import type { EverBookingStatus, EverService, EverSiteBooking } from "../types";

function mapService(row: {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number | null;
  sort_order: number;
  is_active: boolean;
}): EverService {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function mapBooking(row: {
  id: string;
  service_id: string;
  starts_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_postcode: string;
  status: string;
  created_at: string;
  ever_services?: { name: string } | { name: string }[] | null;
}): EverSiteBooking {
  const service = Array.isArray(row.ever_services)
    ? row.ever_services[0]
    : row.ever_services;

  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: service?.name ?? "Service",
    startsAt: row.starts_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    customerPostcode: row.customer_postcode,
    status: row.status as EverBookingStatus,
    createdAt: row.created_at,
  };
}

export async function listActiveEverServices(
  tenantId: string,
): Promise<EverService[]> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("ever_services")
    .select("id, name, duration_minutes, price_cents, sort_order, is_active")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapService);
}

export async function listAllEverServices(
  tenantId: string,
): Promise<EverService[]> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("ever_services")
    .select("id, name, duration_minutes, price_cents, sort_order, is_active")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapService);
}

export async function listEverSiteBookings(
  tenantId: string,
  options: { limit?: number } = {},
): Promise<EverSiteBooking[]> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("ever_site_bookings")
    .select(
      "id, service_id, starts_at, customer_name, customer_phone, customer_email, customer_postcode, status, created_at",
    )
    .eq("tenant_id", tenantId)
    .order("starts_at", { ascending: false })
    .limit(options.limit ?? 200);

  if (error) throw new Error(error.message);

  const services = await listAllEverServices(tenantId);
  const serviceNames = new Map(services.map((service) => [service.id, service.name]));

  return (data ?? []).map((row) =>
    mapBooking({
      ...row,
      ever_services: { name: serviceNames.get(row.service_id) ?? "Service" },
    }),
  );
}

export async function createEverSiteBooking(
  tenantId: string,
  input: {
    serviceId: string;
    startsAt: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerPostcode: string;
  },
): Promise<EverSiteBooking> {
  const supabase = createServiceSupabase();

  const { data: service, error: serviceError } = await supabase
    .from("ever_services")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("id", input.serviceId)
    .eq("is_active", true)
    .maybeSingle();

  if (serviceError) throw new Error(serviceError.message);
  if (!service) {
    throw new Error("Selected service is not available.");
  }

  const { data, error } = await supabase
    .from("ever_site_bookings")
    .insert({
      tenant_id: tenantId,
      service_id: input.serviceId,
      starts_at: input.startsAt,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      customer_email: input.customerEmail.trim(),
      customer_postcode: input.customerPostcode.trim(),
      status: "pending",
    })
    .select(
      "id, service_id, starts_at, customer_name, customer_phone, customer_email, customer_postcode, status, created_at",
    )
    .single();

  if (error) throw new Error(error.message);
  return mapBooking({
    ...data,
    ever_services: { name: service.name },
  });
}

export async function updateEverSiteBookingStatus(
  tenantId: string,
  bookingId: string,
  status: EverBookingStatus,
): Promise<EverSiteBooking> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("ever_site_bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", bookingId)
    .select(
      "id, service_id, starts_at, customer_name, customer_phone, customer_email, customer_postcode, status, created_at",
    )
    .single();

  if (error) throw new Error(error.message);

  const { data: service } = await supabase
    .from("ever_services")
    .select("name")
    .eq("id", data.service_id)
    .maybeSingle();

  return mapBooking({
    ...data,
    ever_services: { name: service?.name ?? "Service" },
  });
}

export async function upsertEverServices(
  tenantId: string,
  services: {
    id?: string;
    name: string;
    durationMinutes: number;
    priceCents: number | null;
    sortOrder: number;
    isActive: boolean;
  }[],
): Promise<EverService[]> {
  const supabase = createServiceSupabase();
  const now = new Date().toISOString();

  const rows = services.map((service, index) => ({
    ...(service.id ? { id: service.id } : {}),
    tenant_id: tenantId,
    name: service.name.trim(),
    duration_minutes: service.durationMinutes,
    price_cents: service.priceCents,
    sort_order: service.sortOrder ?? index + 1,
    is_active: service.isActive,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("ever_services")
    .upsert(rows, { onConflict: "id" })
    .select("id, name, duration_minutes, price_cents, sort_order, is_active")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapService);
}

export async function deleteEverService(
  tenantId: string,
  serviceId: string,
): Promise<void> {
  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from("ever_services")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", serviceId);

  if (error) throw new Error(error.message);
}
