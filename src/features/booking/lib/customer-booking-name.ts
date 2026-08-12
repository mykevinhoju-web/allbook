/** Customer booking name: first name + one-letter family initial (e.g. Lee → L). */

export function formatCustomerSecondNameInput(raw: string): string {
  const letter = raw.replace(/[^A-Za-z]/g, "").slice(0, 1);
  return letter.toUpperCase();
}

export function formatCustomerBookingName(
  firstName: string,
  secondName: string,
): string {
  const first = firstName.trim().replace(/\s+/g, " ");
  const second = formatCustomerSecondNameInput(secondName);
  return `${first} ${second}`.trim();
}

export function isValidCustomerBookingNameParts(
  firstName: string,
  secondName: string,
): boolean {
  const first = firstName.trim();
  const second = formatCustomerSecondNameInput(secondName);
  return first.length >= 1 && second.length === 1;
}
