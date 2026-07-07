export const STAFF_PIN_PATTERN = /^\d{4}$/;

export function validateStaffPin(pin: string): string | null {
  if (!STAFF_PIN_PATTERN.test(pin)) {
    return "PIN must be exactly 4 digits.";
  }
  return null;
}
