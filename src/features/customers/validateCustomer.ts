import type { CustomerInput } from "./types";

export function validateCustomerInput(
  input: Partial<CustomerInput>,
): string | null {
  if (!input.firstName?.trim()) return "First name is required.";
  if (!input.lastName?.trim()) return "Last name is required.";
  return null;
}
