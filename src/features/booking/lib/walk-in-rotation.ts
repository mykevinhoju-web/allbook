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

/** 0 = missing number — keep numbered staff ahead until we fill it. */
export function rotationTieBreak(sortOrder: number): number {
  return sortOrder <= 0 ? Number.MAX_SAFE_INTEGER : sortOrder;
}

/** If nobody has a number yet, use list order 1, 2, 3…; otherwise fill zeros at the end. */
export function fillRotationNumbers<T extends WalkInRotationMember>(
  rotation: T[],
): T[] {
  if (rotation.length === 0) return rotation;
  if (rotation.every((row) => row.sortOrder <= 0)) {
    return rotation.map((row, index) => ({ ...row, sortOrder: index + 1 }));
  }
  let next = Math.max(0, ...rotation.map((row) => row.sortOrder));
  return rotation.map((row) => {
    if (row.sortOrder > 0) return row;
    next += 1;
    return { ...row, sortOrder: next };
  });
}

/** New staff join at the last number. Existing numbers stay as they are. */
export function appendNewcomersAtEnd<T extends WalkInRotationMember>(
  rotation: T[],
  newStaffIds: string[],
): Array<T | WalkInRotationMember> {
  const filled = fillRotationNumbers(rotation);
  const existing = new Set(filled.map((row) => row.staffId));
  const extras = newStaffIds.filter((staffId) => staffId && !existing.has(staffId));
  if (extras.length === 0) return filled;
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
