/**
 * Browser-side service mutations (calls owner-authenticated APIs).
 */
import type { SalonService, ServiceInput, ServiceStatus } from "./types";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

export type CreateServiceOptions = {
  salonId: string;
  input: ServiceInput;
  existing?: SalonService[];
};

export async function createService(
  options: CreateServiceOptions,
): Promise<SalonService> {
  const response = await fetch("/api/platform/salon/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      salonId: options.salonId,
      input: options.input,
      existingCount: options.existing?.length ?? 0,
    }),
  });
  const data = await parseJson<{ service: SalonService }>(response);
  return data.service;
}

export async function updateService(
  service: SalonService,
  patch: Partial<ServiceInput> & { status?: ServiceStatus },
): Promise<SalonService> {
  const response = await fetch(`/api/platform/salon/services/${service.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ salonId: service.salonId, patch }),
  });
  const data = await parseJson<{ service: SalonService }>(response);
  return data.service;
}

export async function duplicateService(
  service: SalonService,
): Promise<SalonService> {
  const response = await fetch(
    `/api/platform/salon/services/${service.id}/duplicate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonId: service.salonId }),
    },
  );
  const data = await parseJson<{ service: SalonService }>(response);
  return data.service;
}

export async function archiveService(
  service: SalonService,
): Promise<SalonService> {
  return updateService(service, { status: "archived", bookingEnabled: false });
}

export async function restoreService(
  service: SalonService,
): Promise<SalonService> {
  return updateService(service, { status: "active", bookingEnabled: true });
}

export async function deleteService(
  _services: SalonService[],
  serviceId: string,
): Promise<SalonService[]> {
  // Soft-delete via archive; caller passes full list for signature compat.
  const target = _services.find((s) => s.id === serviceId);
  if (!target) return _services;
  const archived = await archiveService(target);
  return _services.map((s) => (s.id === archived.id ? archived : s));
}

export async function deleteServices(
  services: SalonService[],
  serviceIds: string[],
): Promise<SalonService[]> {
  const next = [...services];
  for (const id of serviceIds) {
    const idx = next.findIndex((s) => s.id === id);
    if (idx < 0) continue;
    const archived = await archiveService(next[idx]!);
    next[idx] = archived;
  }
  return next;
}
