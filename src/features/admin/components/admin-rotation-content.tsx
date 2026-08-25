"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, Loader2, ListOrdered, Minus, Plus } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import {
  pickWalkInStaff,
  appendNewcomersAtEnd,
  reindexBlankRotationOrders,
} from "@/features/booking/lib/walk-in-rotation";
import { cn } from "@/lib/utils";

type WorkingStaff = {
  id: string;
  name: string;
  inService: boolean;
  roomName: string | null;
  walkInCount: number;
  inRotation: boolean;
};

type RotationRow = {
  staffId: string;
  name: string;
  sortOrder: number;
  inService: boolean;
  roomName: string | null;
  walkInCount: number;
};

type RotationResponse = {
  date: string;
  working: WorkingStaff[];
  rotation: RotationRow[];
  error?: string;
};

function toRow(staff: WorkingStaff, sortOrder: number): RotationRow {
  return {
    staffId: staff.id,
    name: staff.name,
    sortOrder,
    inService: staff.inService,
    roomName: staff.roomName,
    walkInCount: staff.walkInCount,
  };
}

function mergeOnShiftRotation(
  rotation: RotationRow[],
  working: WorkingStaff[],
): RotationRow[] {
  const workingById = new Map(working.map((row) => [row.id, row]));
  const kept = rotation
    .filter((row) => workingById.has(row.staffId))
    .map((row) => {
      const staff = workingById.get(row.staffId)!;
      return {
        ...row,
        name: staff.name,
        inService: staff.inService,
        roomName: staff.roomName,
        walkInCount: staff.walkInCount,
      };
    });
  const extraIds = working
    .filter((staff) => !kept.some((row) => row.staffId === staff.id))
    .map((staff) => staff.id);
  return reindexBlankRotationOrders(
    appendNewcomersAtEnd(kept, extraIds).map((row) => {
      const staff = workingById.get(row.staffId);
      return staff
        ? toRow(staff, row.sortOrder)
        : {
            staffId: row.staffId,
            name: "Staff",
            sortOrder: row.sortOrder,
            inService: false,
            roomName: null,
            walkInCount: 0,
          };
    }),
  );
}

/** Refresh live badges without touching unsaved 순번 / list order. */
function mergeLiveFields(
  current: RotationRow[],
  working: WorkingStaff[],
  keepWalkInIds?: Set<string>,
): RotationRow[] {
  const workingById = new Map(working.map((row) => [row.id, row]));
  return current.map((row) => {
    const staff = workingById.get(row.staffId);
    if (!staff) return row;
    return {
      ...row,
      name: staff.name,
      inService: staff.inService,
      roomName: staff.roomName,
      walkInCount: keepWalkInIds?.has(row.staffId)
        ? row.walkInCount
        : staff.walkInCount,
    };
  });
}

function draftValue(sortOrder: number): string {
  return sortOrder > 0 ? String(sortOrder) : "";
}

/** Apply draft 순번, then order the list for save (numbered first). */
function applyDraftsForSave(
  list: RotationRow[],
  drafts: Record<string, string>,
): RotationRow[] {
  const withNumbers = list.map((row) => {
    if (!(row.staffId in drafts)) return row;
    const trimmed = drafts[row.staffId]!.trim();
    if (!trimmed) return { ...row, sortOrder: 0 };
    const order = Number(trimmed);
    if (!Number.isFinite(order) || order < 1) return { ...row, sortOrder: 0 };
    return { ...row, sortOrder: Math.round(order) };
  });

  const numbered = withNumbers
    .filter((row) => row.sortOrder > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const blank = withNumbers.filter((row) => row.sortOrder <= 0);
  return reindexBlankRotationOrders([...numbered, ...blank]);
}

export function AdminRotationContent() {
  const [rotation, setRotation] = useState<RotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const pendingWalkInRef = useRef(new Set<string>());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const applyRotationState = useCallback(
    (nextWorking: WorkingStaff[], nextRotation: RotationRow[]) => {
      const merged = mergeOnShiftRotation(nextRotation, nextWorking);
      setRotation(merged);
      setDrafts(
        Object.fromEntries(
          merged.map((row) => [row.staffId, draftValue(row.sortOrder)]),
        ),
      );
      setDirty(false);
    },
    [],
  );

  const load = useCallback(
    async (opts?: { silent?: boolean; force?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const response = await fetchAdminApi("/api/admin/rotation");
        const data = (await response.json()) as RotationResponse;
        if (!response.ok) {
          toast.error("Could not load rotation", {
            description: data.error ?? "Try again.",
          });
          return;
        }
        const working = data.working ?? [];
        const nextRotation = data.rotation ?? [];

        // While editing, only refresh live status — never overwrite unsaved 순번.
        if (opts?.silent && dirtyRef.current && !opts.force) {
          setRotation((current) =>
            mergeLiveFields(current, working, pendingWalkInRef.current),
          );
          return;
        }

        if (opts?.silent && pendingWalkInRef.current.size > 0) {
          setRotation((current) => {
            const merged = mergeOnShiftRotation(nextRotation, working);
            return mergeLiveFields(
              merged.map((row) => {
                const prev = current.find((item) => item.staffId === row.staffId);
                return prev && pendingWalkInRef.current.has(row.staffId)
                  ? { ...row, walkInCount: prev.walkInCount }
                  : row;
              }),
              working,
              pendingWalkInRef.current,
            );
          });
          const merged = mergeOnShiftRotation(nextRotation, working);
          setDrafts(
            Object.fromEntries(
              merged.map((row) => [row.staffId, draftValue(row.sortOrder)]),
            ),
          );
          setDirty(false);
          return;
        }

        applyRotationState(working, nextRotation);
      } catch {
        if (!opts?.silent) toast.error("Could not load rotation");
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [applyRotationState],
  );

  useEffect(() => {
    void load();
    const intervalId = window.setInterval(() => {
      void load({ silent: true });
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, [load]);

  const save = async () => {
    const roster = applyDraftsForSave(rotation, drafts);
    setRotation(roster);
    setDrafts(
      Object.fromEntries(
        roster.map((row) => [row.staffId, draftValue(row.sortOrder)]),
      ),
    );
    setSaving(true);
    try {
      const response = await fetchAdminApi("/api/admin/rotation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roster: roster.map((row) => ({
            staffId: row.staffId,
            sortOrder: row.sortOrder,
          })),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error("Could not save rotation", {
          description: data.error ?? "Try again.",
        });
        return;
      }
      toast.success("Rotation saved");
      setDirty(false);
      dirtyRef.current = false;
      await load({ force: true });
    } catch {
      toast.error("Could not save rotation");
    } finally {
      setSaving(false);
    }
  };

  const moveByDrag = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setDirty(true);
    setRotation((current) => {
      const from = current.findIndex((row) => row.staffId === fromId);
      const to = current.findIndex((row) => row.staffId === toId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      if (!item) return current;
      next.splice(to, 0, item);
      return next;
    });
  };

  const bumpWalkInCount = async (staffId: string, step: 1 | -1) => {
    if (pendingWalkInRef.current.has(staffId)) return;
    pendingWalkInRef.current.add(staffId);
    setAdjustingId(staffId);
    setRotation((current) =>
      current.map((row) =>
        row.staffId === staffId
          ? { ...row, walkInCount: Math.max(0, row.walkInCount + step) }
          : row,
      ),
    );
    try {
      const response = await fetchAdminApi("/api/admin/rotation/walk-in-count", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, step }),
      });
      const data = (await response.json()) as {
        walkInCount?: number;
        error?: string;
      };
      if (!response.ok) {
        toast.error("Could not update walk-ins", {
          description: data.error ?? "Try again.",
        });
        pendingWalkInRef.current.delete(staffId);
        await load({ silent: true });
        return;
      }
      const nextCount = Math.max(0, data.walkInCount ?? 0);
      setRotation((current) =>
        current.map((row) =>
          row.staffId === staffId ? { ...row, walkInCount: nextCount } : row,
        ),
      );
    } catch {
      toast.error("Could not update walk-ins");
      pendingWalkInRef.current.delete(staffId);
      await load({ silent: true });
    } finally {
      pendingWalkInRef.current.delete(staffId);
      setAdjustingId(null);
    }
  };

  const previewRoster = useMemo(
    () => applyDraftsForSave(rotation, drafts),
    [rotation, drafts],
  );

  const nextStaffId = useMemo(() => {
    return pickWalkInStaff({
      rotation: previewRoster.map((row) => ({
        staffId: row.staffId,
        sortOrder: row.sortOrder,
      })),
      walkInCounts: Object.fromEntries(
        rotation.map((row) => [row.staffId, row.walkInCount]),
      ),
      inServiceIds: rotation
        .filter((row) => row.inService)
        .map((row) => row.staffId),
      slotBusyIds: [],
    });
  }, [previewRoster, rotation]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:p-6">
      <AdminPageHeader
        title="Rotation"
        description="Change 순번 or drag to reorder, then press Save rotation. + / − for walk-in counts save immediately."
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">On shift now</p>
              <p className="text-xs text-muted-foreground">
                Edits stay on this screen until you Save. Blue name = next
                walk-in (preview).
              </p>
            </div>
            <ListOrdered className="size-4 text-muted-foreground" />
          </div>

          {rotation.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
              No staff are on shift right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {rotation.map((row) => {
                const isNext = row.staffId === nextStaffId;
                return (
                  <li
                    key={row.staffId}
                    draggable
                    onDragStart={() => setDraggingId(row.staffId)}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(event) => {
                      if (!draggingId) return;
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggingId) moveByDrag(draggingId, row.staffId);
                      setDraggingId(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border bg-background px-3 py-2",
                      isNext
                        ? "border-blue-400/50 bg-blue-50/70 dark:border-blue-500/40 dark:bg-blue-950/30"
                        : "border-border/50",
                      draggingId === row.staffId && "opacity-50",
                    )}
                  >
                    <span
                      className="flex size-9 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted-foreground active:cursor-grabbing"
                      aria-hidden
                    >
                      <GripVertical className="size-4" />
                    </span>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={drafts[row.staffId] ?? ""}
                      onChange={(event) => {
                        setDirty(true);
                        setDrafts((current) => ({
                          ...current,
                          [row.staffId]: event.target.value,
                        }));
                      }}
                      className={cn(
                        "h-11 w-16 shrink-0 rounded-xl px-2 text-center text-lg font-semibold tabular-nums",
                        isNext &&
                          "border-blue-400/60 text-blue-700 dark:text-blue-300",
                      )}
                      aria-label={`Turn order for ${row.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold",
                            isNext && "text-blue-600 dark:text-blue-400",
                          )}
                        >
                          {row.name}
                        </p>
                        {row.inService ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                            In service
                          </span>
                        ) : null}
                        {row.inService && row.roomName ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                            {row.roomName}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        walk-in {row.walkInCount}
                      </p>
                    </div>
                    <div
                      className="flex shrink-0 items-center gap-1"
                      onPointerDown={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <AppButton
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-lg"
                        disabled={
                          saving ||
                          adjustingId === row.staffId ||
                          row.walkInCount <= 0
                        }
                        aria-label={`Decrease walk-ins for ${row.name}`}
                        onClick={() => void bumpWalkInCount(row.staffId, -1)}
                      >
                        <Minus className="size-4" />
                      </AppButton>
                      <p className="w-10 text-center text-sm font-semibold tabular-nums">
                        {row.walkInCount}
                      </p>
                      <AppButton
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-lg"
                        disabled={saving || adjustingId === row.staffId}
                        aria-label={`Increase walk-ins for ${row.name}`}
                        onClick={() => void bumpWalkInCount(row.staffId, 1)}
                      >
                        <Plus className="size-4" />
                      </AppButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <AppButton
            type="button"
            className="mt-4 h-11 w-full rounded-xl"
            disabled={saving || rotation.length === 0}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save rotation"}
          </AppButton>
          {dirty ? (
            <p className="mt-2 text-center text-xs text-amber-700 dark:text-amber-400">
              Unsaved 순번 / order changes
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
