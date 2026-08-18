"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GripVertical, Loader2, ListOrdered, Minus, Plus } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import { pickWalkInStaff } from "@/features/booking/lib/walk-in-rotation";
import { useOptionalTenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

type WorkingStaff = {
  id: string;
  name: string;
  inService: boolean;
  walkInCount: number;
  inRotation: boolean;
};

type RotationRow = {
  staffId: string;
  name: string;
  sortOrder: number;
  inService: boolean;
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
    walkInCount: staff.walkInCount,
  };
}

function insertAtOrder(
  list: RotationRow[],
  row: RotationRow,
  order: number,
): RotationRow[] {
  const without = list.filter((item) => item.staffId !== row.staffId);
  const index = Math.max(0, Math.min(without.length, Math.round(order) - 1));
  without.splice(index, 0, { ...row, sortOrder: Math.max(0, Math.round(order)) });
  return without;
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
        walkInCount: staff.walkInCount,
      };
    });
  const keptIds = new Set(kept.map((row) => row.staffId));
  const extras = working
    .filter((staff) => !keptIds.has(staff.id))
    .map((staff) => toRow(staff, 0));
  return [...kept, ...extras];
}

export function AdminRotationContent() {
  const tenant = useOptionalTenant();
  const timeZone = tenant?.settings.timezone || "Australia/Sydney";
  const today = todayDateInZone(timeZone);
  const [rotation, setRotation] = useState<RotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const applyRotationState = useCallback(
    (nextWorking: WorkingStaff[], nextRotation: RotationRow[]) => {
      const merged = mergeOnShiftRotation(nextRotation, nextWorking);
      setRotation(merged);
      setDrafts(
        Object.fromEntries(
          merged.map((row) => [row.staffId, String(row.sortOrder)]),
        ),
      );
    },
    [],
  );

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
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
        applyRotationState(data.working ?? [], data.rotation ?? []);
      } catch {
        toast.error("Could not load rotation");
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

  const save = async (next = rotation) => {
    setSaving(true);
    try {
      const response = await fetchAdminApi("/api/admin/rotation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roster: next.map((row) => ({
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
      await load();
    } catch {
      toast.error("Could not save rotation");
    } finally {
      setSaving(false);
    }
  };

  const applyOrder = (staff: WorkingStaff, raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setRotation((current) => {
        const next = current.filter((row) => row.staffId !== staff.id);
        setDrafts(
          Object.fromEntries(
            next.map((row) => [row.staffId, String(row.sortOrder)]),
          ),
        );
        return next;
      });
      return;
    }
    const order = Number(trimmed);
    if (!Number.isFinite(order) || order < 0) {
      const existing = rotation.find((row) => row.staffId === staff.id);
      setDrafts((current) => ({
        ...current,
        [staff.id]: existing ? String(existing.sortOrder) : "",
      }));
      return;
    }
    setRotation((current) => {
      const next = insertAtOrder(current, toRow(staff, order), order);
      setDrafts(
        Object.fromEntries(
          next.map((row) => [row.staffId, String(row.sortOrder)]),
        ),
      );
      return next;
    });
  };

  const moveByDrag = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setRotation((current) => {
      const from = current.findIndex((row) => row.staffId === fromId);
      const to = current.findIndex((row) => row.staffId === toId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      if (!item) return current;
      next.splice(to, 0, item);
      setDrafts(
        Object.fromEntries(
          next.map((row) => [row.staffId, String(row.sortOrder)]),
        ),
      );
      return next;
    });
  };

  const bumpWalkInCount = async (staffId: string, step: 1 | -1) => {
    if (adjustingId) return;
    setAdjustingId(staffId);
    try {
      const response = await fetchAdminApi("/api/admin/rotation/walk-in-count", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, staffId, step }),
      });
      const data = (await response.json()) as {
        walkInCount?: number;
        error?: string;
      };
      if (!response.ok) {
        toast.error("Could not update walk-ins", {
          description: data.error ?? "Try again.",
        });
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
    } finally {
      setAdjustingId(null);
    }
  };

  const nextStaffId = useMemo(() => {
    return pickWalkInStaff({
      rotation: rotation.map((row) => ({
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
  }, [rotation]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:p-6">
      <AdminPageHeader
        title="Rotation"
        description="Numbers show today’s walk-in order. The next turn is highlighted in blue — book that staff manually, then the next person updates."
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
                Number = turn order. Blue name = next walk-in. + / − fixes
                today’s walk-in count.
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
                      min={0}
                      inputMode="numeric"
                      value={drafts[row.staffId] ?? String(row.sortOrder)}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [row.staffId]: event.target.value,
                        }))
                      }
                      onBlur={(event) =>
                        applyOrder(
                          {
                            id: row.staffId,
                            name: row.name,
                            inService: row.inService,
                            walkInCount: row.walkInCount,
                            inRotation: true,
                          },
                          event.target.value,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                      }}
                      className={cn(
                        "h-11 w-16 shrink-0 rounded-xl px-2 text-center text-lg font-semibold tabular-nums",
                        isNext && "border-blue-400/60 text-blue-700 dark:text-blue-300",
                      )}
                      aria-label={`Turn order for ${row.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-semibold",
                          isNext && "text-blue-600 dark:text-blue-400",
                        )}
                      >
                        {row.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        walk-in {row.walkInCount}
                        {row.inService ? " · in service" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <AppButton
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-lg"
                        disabled={
                          saving ||
                          Boolean(adjustingId) ||
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
                        disabled={saving || Boolean(adjustingId)}
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
            disabled={saving || Boolean(adjustingId) || rotation.length === 0}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save rotation"}
          </AppButton>
        </section>
      )}
      {Boolean(adjustingId) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}
