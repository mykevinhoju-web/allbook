import type { ServiceInput } from "./types";
import { SERVICE_CATEGORIES } from "./constants";

export function validateServiceInput(
  input: Partial<ServiceInput>,
): string | null {
  if (!input.name?.trim()) return "Service name is required.";
  if (!input.category || !SERVICE_CATEGORIES.includes(input.category)) {
    return "Choose a valid category.";
  }
  if (input.duration == null || Number.isNaN(input.duration) || input.duration <= 0) {
    return "Duration must be greater than 0.";
  }
  if (input.price == null || Number.isNaN(input.price) || input.price < 0) {
    return "Price must be 0 or greater.";
  }

  const priceType = input.priceType ?? "fixed";
  if (priceType === "range") {
    if (input.priceMax == null || input.priceMax < input.price) {
      return "Price range needs a max greater than or equal to the min.";
    }
  }

  return null;
}
