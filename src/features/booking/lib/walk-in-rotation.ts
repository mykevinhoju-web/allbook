/** Form sentinel — not a real staff UUID. */
export const WALK_IN_SENTINEL = "__walk_in__";

const WALK_IN_MARKER_RE = /\[walkin\]/i;

export function isWalkInBooking(notes?: string | null): boolean {
  if (!notes) return false;
  return WALK_IN_MARKER_RE.test(notes);
}

export function withWalkInNote(notes?: string | null): string {
  const rest = stripWalkInNote(notes).trim();
  return rest ? `[walkin] ${rest}` : "[walkin]";
}

export function stripWalkInNote(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(/\[walkin\]\s*/gi, "").trim();
}

export type WalkInRotationMember = {
  staffId: string;
  sortOrder: number;
};

/** 0 = no person number yet — walk-in counts still decide the next turn. */
export function rotationTieBreak(sortOrder: number): number {
  return sortOrder <= 0 ? Number.MAX_SAFE_INTEGER : sortOrder;
}

function hasAnyPersonNumber(rotation: WalkInRotationMember[]): boolean {
  return rotation.some((row) => row.sortOrder > 0);
}

/**
 * A fresh rotation stays unnumbered. Do not invent 1, 2, 3 for everyone.
 * Sequential 1..n is treated as auto-assigned and cleared.
 */
export function fillRotationNumbers<T extends WalkInRotationMember>(
  rotation: T[],
): T[] {
  return stripAutoRotationNumbers(rotation);
}

/** Sequential 1..n was auto-assigned — treat as a fresh rotation with no 순번. */
export function stripAutoRotationNumbers<T extends WalkInRotationMember>(
  rotation: T[],
): T[] {
  if (rotation.length === 0) return rotation;
  const autoNumbered = rotation.every((row, index) => row.sortOrder === index + 1);
  if (!autoNumbered) return rotation;
  return rotation.map((row) => ({ ...row, sortOrder: 0 }));
}

/** New staff take the last number only when the roster already has 순번. */
export function appendNewcomersAtEnd<T extends WalkInRotationMember>(
  rotation: T[],
  newStaffIds: string[],
): Array<T | WalkInRotationMember> {
  const stripped = stripAutoRotationNumbers(rotation);
  const filled = fillRotationNumbers(stripped);
  const existing = new Set(filled.map((row) => row.staffId));
  const extras = newStaffIds.filter((staffId) => staffId && !existing.has(staffId));
  if (extras.length === 0) return filled;
  if (!hasAnyPersonNumber(filled)) {
    return [
      ...filled,
      ...extras.map((staffId) => ({ staffId, sortOrder: 0 })),
    ];
  }
  let next = Math.max(0, ...filled.map((row) => row.sortOrder));
  return [
    ...filled,
    ...extras.map((staffId) => {
      next += 1;
      return { staffId, sortOrder: next };
    }),
  ];
}

/**
 * Next walk-in staff: idle people first, then fewest walk-ins today,
 * then the saved rotation order (catch-up for skipped busy staff).
 * Unranked (0) staff wait behind numbered staff when counts are equal.
 */
export function pickWalkInStaff(args: {
  rotation: WalkInRotationMember[];
  walkInCounts: Record<string, number>;
  inServiceIds: Iterable<string>;
  slotBusyIds: Iterable<string>;
  offShiftIds?: Iterable<string>;
}): string | null {
  if (args.rotation.length === 0) return null;

  const inService = new Set(args.inServiceIds);
  const slotBusy = new Set(args.slotBusyIds);
  const offShift = new Set(args.offShiftIds ?? []);

  const eligible = args.rotation.filter(
    (row) =>
      !inService.has(row.staffId) &&
      !slotBusy.has(row.staffId) &&
      !offShift.has(row.staffId),
  );
  if (eligible.length === 0) return null;

  eligible.sort((a, b) => {
    const countA = args.walkInCounts[a.staffId] ?? 0;
    const countB = args.walkInCounts[b.staffId] ?? 0;
    return countA - countB || rotationTieBreak(a.sortOrder) - rotationTieBreak(b.sortOrder);
  });

  return eligible[0]?.staffId ?? null;
}
