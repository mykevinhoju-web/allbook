import type { ServiceInput, ServicePriceType } from "./types";
import { isValidServiceDuration, SERVICE_CATEGORIES } from "./constants";

export function validateServiceInput(
  input: Partial<ServiceInput>,
): string | null {
  if (!input.name?.trim()) return "Service name is required.";
  if (!input.category || !SERVICE_CATEGORIES.includes(input.category)) {
    return "Choose a valid category.";
  }
  if (input.duration == null || !isValidServiceDuration(input.duration)) {
    return "Choose a valid duration.";
  }
  if (input.price == null || Number.isNaN(input.price) || input.price < 0) {
    return "Price is required.";
  }

  const priceType = (input.priceType ?? "fixed") as ServicePriceType;
  if (priceType === "range") {
    if (input.priceMax == null || input.priceMax < input.price) {
      return "Price range needs a max greater than or equal to the min.";
    }
  }

  return null;
}
