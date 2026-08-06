/** Fixed UI locale — never use browser default (avoids Korean 오전/오후 on ko-KR devices). */
export const DISPLAY_LOCALE = "en-AU";

export function formatAmPmTimeFromDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const parts = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value;

  if (dayPeriod) {
    return `${hour}:${minute} ${dayPeriod.toUpperCase()}`;
  }

  return `${hour}:${minute}`;
}

export function formatDisplayDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date =
    typeof value === "string"
      ? new Date(value.includes("T") ? value : `${value}T12:00:00`)
      : value;

  return date.toLocaleDateString(DISPLAY_LOCALE, options);
}
