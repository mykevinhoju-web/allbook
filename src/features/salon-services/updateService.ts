import { MOCK_SERVICE_STAFF } from "./mock-data";
import type { SalonService, ServiceInput, ServiceStatus } from "./types";
import { validateServiceInput } from "./validate";

export type UpdateServicePatch = Partial<ServiceInput> & {
  status?: ServiceStatus;
};

/**
 * Updates a service entity (mock-ready).
 */
export async function updateService(
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

  const staffIds = nextInput.staffIds;

  return {
    ...service,
    name: nextInput.name.trim(),
    category: nextInput.category,
    description: nextInput.description?.trim() ?? "",
    duration: nextInput.duration,
    price: nextInput.price,
    priceMax:
      nextInput.priceType === "range" ? (nextInput.priceMax ?? null) : null,
    priceType: nextInput.priceType,
    staffIds,
    staff: MOCK_SERVICE_STAFF.filter((s) => staffIds.includes(s.id)),
    displayOrder: nextInput.displayOrder ?? service.displayOrder,
    status: nextInput.status ?? service.status,
    featured: nextInput.featured ?? service.featured,
    bookingEnabled: nextInput.bookingEnabled ?? service.bookingEnabled,
    updatedAt: new Date().toISOString(),
  };
}

export async function duplicateService(
  service: SalonService,
): Promise<SalonService> {
  const now = new Date().toISOString();
  return {
    ...service,
    id: `svc_${crypto.randomUUID().slice(0, 8)}`,
    name: `${service.name} (Copy)`,
    featured: false,
    displayOrder: service.displayOrder + 1,
    createdAt: now,
    updatedAt: now,
  };
}

export async function archiveService(
  service: SalonService,
): Promise<SalonService> {
  return updateService(service, { status: "archived", bookingEnabled: false });
}
