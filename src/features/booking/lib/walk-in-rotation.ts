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

/**
 * Next walk-in staff: idle people first, then fewest walk-ins today,
 * then the saved rotation order (catch-up for skipped busy staff).
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
    return countA - countB || a.sortOrder - b.sortOrder;
  });

  return eligible[0]?.staffId ?? null;
}
