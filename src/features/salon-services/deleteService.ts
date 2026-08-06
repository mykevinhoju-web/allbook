import type { SalonService } from "./types";

/**
 * Soft preference: archive when possible.
 * Hard delete removes from the working list (mock-ready).
 */
export async function deleteService(
  services: SalonService[],
  serviceId: string,
): Promise<SalonService[]> {
  return services.filter((s) => s.id !== serviceId);
}

export async function deleteServices(
  services: SalonService[],
  serviceIds: string[],
): Promise<SalonService[]> {
  const remove = new Set(serviceIds);
  return services.filter((s) => !remove.has(s.id));
}
