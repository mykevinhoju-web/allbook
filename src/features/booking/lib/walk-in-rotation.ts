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

/** 0 = no person number yet — walk-in counts still decide the next turn.
 * Negative = blank 순번 but preserves list order after save (‑1, ‑2, …).
 */
export function rotationTieBreak(sortOrder: number): number {
  return sortOrder <= 0 ? Number.MAX_SAFE_INTEGER : sortOrder;
}

function hasAnyPersonNumber(rotation: WalkInRotationMember[]): boolean {
  return rotation.some((row) => row.sortOrder > 0);
}

/** Stable list order: explicit 순번 first, then blank slots by saved position. */
export function rotationListRank(sortOrder: number): number {
  if (sortOrder > 0) return sortOrder;
  if (sortOrder < 0) return 100_000 + Math.abs(sortOrder);
  return 200_000;
}

export function compareRotationListOrder(
  a: WalkInRotationMember,
  b: WalkInRotationMember,
): number {
  return rotationListRank(a.sortOrder) - rotationListRank(b.sortOrder);
}

/**
 * Keep saved person numbers as-is. Do not invent or clear 1..n —
 * admins set those deliberately via Save rotation.
 */
export function fillRotationNumbers<T extends WalkInRotationMember>(
  rotation: T[],
): T[] {
  return rotation;
}

/** @deprecated No longer strips user-saved sequential numbers. */
export function stripAutoRotationNumbers<T extends WalkInRotationMember>(
  rotation: T[],
): T[] {
  return rotation;
}

/** Blank 순번 rows keep list position via negative sort_order (−1, −2, …). */
export function reindexBlankRotationOrders<T extends WalkInRotationMember>(
  rotation: T[],
): T[] {
  return rotation.map((row, index) =>
    row.sortOrder > 0 ? row : { ...row, sortOrder: -(index + 1) },
  );
}

/** New staff take the last number only when the roster already has 순번. */
export function appendNewcomersAtEnd<T extends WalkInRotationMember>(
  rotation: T[],
  newStaffIds: string[],
): Array<T | WalkInRotationMember> {
  const existing = new Set(rotation.map((row) => row.staffId));
  const extras = newStaffIds.filter(
    (staffId) => staffId && !existing.has(staffId),
  );
  if (extras.length === 0) return rotation;
  if (!hasAnyPersonNumber(rotation)) {
    const next = [
      ...rotation,
      ...extras.map((staffId) => ({ staffId, sortOrder: 0 })),
    ];
    return reindexBlankRotationOrders(next);
  }
  let nextNum = Math.max(0, ...rotation.map((row) => row.sortOrder));
  return [
    ...rotation,
    ...extras.map((staffId) => {
      nextNum += 1;
      return { staffId, sortOrder: nextNum };
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
