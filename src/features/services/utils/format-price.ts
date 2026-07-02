export function formatPriceFromCents(
  cents: number,
  currency = "AUD",
  locale = "en-AU",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatServiceOptionLabel(
  durationMinutes: number,
  priceCents: number,
  currency = "AUD",
): string {
  const duration =
    durationMinutes === 60 ? "1 hour" : `${durationMinutes} min`;
  return `${duration} — ${formatPriceFromCents(priceCents, currency)}`;
}
