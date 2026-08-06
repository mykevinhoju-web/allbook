import { MOCK_SERVICE_STAFF } from "./mock-data";
import type { SalonService, ServiceInput } from "./types";
import { validateServiceInput } from "./validate";

export type CreateServiceOptions = {
  salonId: string;
  input: ServiceInput;
  /** Existing list — used to compute next display order when omitted. */
  existing?: SalonService[];
};

/**
 * Creates a service entity (mock-ready).
 * Persists via API later; duration is the booking slot length.
 */
export async function createService(
  options: CreateServiceOptions,
): Promise<SalonService> {
  const error = validateServiceInput(options.input);
  if (error) throw new Error(error);

  const now = new Date().toISOString();
  const nextOrder =
    options.input.displayOrder ??
    Math.max(0, ...(options.existing ?? []).map((s) => s.displayOrder)) + 1;

  const staffIds = options.input.staffIds ?? [];
  const status = options.input.status ?? "active";

  return {
    id: `svc_${crypto.randomUUID().slice(0, 8)}`,
    salonId: options.salonId,
    name: options.input.name.trim(),
    category: options.input.category,
    description: options.input.description?.trim() ?? "",
    duration: options.input.duration,
    price: options.input.price,
    priceMax:
      options.input.priceType === "range"
        ? (options.input.priceMax ?? null)
        : null,
    priceType: options.input.priceType,
    staffIds,
    staff: MOCK_SERVICE_STAFF.filter((s) => staffIds.includes(s.id)),
    displayOrder: nextOrder,
    status,
    featured: options.input.featured ?? false,
    bookingEnabled: options.input.bookingEnabled ?? true,
    createdAt: now,
    updatedAt: now,
  };
}
