/** Australian mobile: 04XXXXXXXX (10 digits). */
const AU_MOBILE_DIGITS = /^04\d{8}$/;

/** Australian postcodes are four digits from 0200–9999. */
const AU_POSTCODE = /^(0[2-9]\d{2}|[1-9]\d{3})$/;

export const AU_MOBILE_PREFIX = "04";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Keep the 04 prefix while typing; max 10 digits. Display as 04XX XXX XXX. */
export function formatAuMobileInput(raw: string): string {
  let digits = digitsOnly(raw);
  if (!digits.startsWith("04")) {
    const rest = digits.replace(/^0?4?/, "");
    digits = `${AU_MOBILE_PREFIX}${rest}`;
  }
  digits = digits.slice(0, 10);

  if (digits.length <= 4) return digits;
  if (digits.length <= 7) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function normalizeAuMobile(value: string): string {
  return digitsOnly(value).slice(0, 10);
}

export function isValidAuMobile(value: string): boolean {
  return AU_MOBILE_DIGITS.test(normalizeAuMobile(value));
}

export function formatAuPostcodeInput(raw: string): string {
  return digitsOnly(raw).slice(0, 4);
}

export function isValidAuPostcode(value: string): boolean {
  return AU_POSTCODE.test(digitsOnly(value));
}
