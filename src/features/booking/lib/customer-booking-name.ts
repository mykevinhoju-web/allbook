/** Customer booking name: First Name + Second Name (family name). */

export function formatCustomerBookingName(
  firstName: string,
  secondName: string,
): string {
  const first = firstName.trim().replace(/\s+/g, " ");
  const second = secondName.trim().replace(/\s+/g, " ");
  return `${first} ${second}`.trim();
}

export function isValidCustomerBookingNameParts(
  firstName: string,
  secondName: string,
): boolean {
  const first = firstName.trim();
  const second = secondName.trim();
  return first.length >= 1 && second.length >= 1;
}
