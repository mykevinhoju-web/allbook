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

/** Split stored "First L" booking name back into form parts. */
export function parseCustomerBookingName(fullName: string | null | undefined): {
  firstName: string;
  secondName: string;
} {
  const trimmed = fullName?.trim().replace(/\s+/g, " ") ?? "";
  if (!trimmed) return { firstName: "", secondName: "" };

  const parts = trimmed.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0]!, secondName: "" };
  }

  const last = parts[parts.length - 1]!;
  if (last.length === 1 && /[A-Za-z]/.test(last)) {
    return {
      firstName: parts.slice(0, -1).join(" "),
      secondName: last.toUpperCase(),
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    secondName: formatCustomerSecondNameInput(last),
  };
}
