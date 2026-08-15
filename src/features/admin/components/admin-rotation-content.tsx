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
  without.splice(index, 0, row);
  return without.map((item, i) => ({ ...item, sortOrder: i + 1 }));
}

export function AdminRotationContent() {
  const tenant = useOptionalTenant();
  const timeZone = tenant?.settings.timezone || "Australia/Sydney";
  const today = todayDateInZone(timeZone);
  const [working, setWorking] = useState<WorkingStaff[]>([]);
  const [rotation, setRotation] = useState<RotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
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
      const nextRotation = data.rotation ?? [];
      setWorking(data.working ?? []);
      setRotation(nextRotation);
      setDrafts(
        Object.fromEntries(
          nextRotation.map((row) => [row.staffId, String(row.sortOrder)]),
        ),
      );
    } catch {
      toast.error("Could not load rotation");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

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
          staffIds: next.map((row) => row.staffId),
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
        const next = current
          .filter((row) => row.staffId !== staff.id)
          .map((row, i) => ({ ...row, sortOrder: i + 1 }));
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
    if (!Number.isFinite(order) || order < 1) {
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
      const ordered = next.map((row, i) => ({ ...row, sortOrder: i + 1 }));
      setDrafts(
        Object.fromEntries(
          ordered.map((row) => [row.staffId, String(row.sortOrder)]),
        ),
      );
      return ordered;
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
      setWorking((current) =>
        current.map((row) =>
          row.id === staffId ? { ...row, walkInCount: nextCount } : row,
        ),
      );
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

  const rows = useMemo(() => {
    const inRotation = new Set(rotation.map((row) => row.staffId));
    const assigned = rotation.map((row) => {
      const staff = working.find((item) => item.id === row.staffId);
      return {
        staff: staff ?? {
          id: row.staffId,
          name: row.name,
          inService: row.inService,
          walkInCount: row.walkInCount,
          inRotation: true,
        },
        assigned: true,
      };
    });
    const rest = working
      .filter((staff) => !inRotation.has(staff.id))
      .map((staff) => ({ staff, assigned: false }));
    return [...assigned, ...rest];
  }, [rotation, working]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:p-6">
      <AdminPageHeader
        title="Rotation"
        description="Staff appear while they are on shift and drop off when the shift ends. The saved order stays the same. Type a number or drag to set order. Use + / − if a guest was booked as named instead of walk-in."
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
                Number = walk-in turn. + / − fixes today’s walk-in count.
              </p>
            </div>
            <ListOrdered className="size-4 text-muted-foreground" />
          </div>

          {working.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
              No staff are on shift right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map(({ staff, assigned }) => (
                <li
                  key={staff.id}
                  draggable={assigned}
                  onDragStart={() => setDraggingId(staff.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => {
                    if (!assigned || !draggingId) return;
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggingId) moveByDrag(draggingId, staff.id);
                    setDraggingId(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border bg-background px-3 py-2",
                    assigned ? "border-border/50" : "border-border/30",
                    draggingId === staff.id && "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground",
                      assigned ? "cursor-grab active:cursor-grabbing" : "opacity-30",
                    )}
                    aria-hidden
                  >
                    <GripVertical className="size-4" />
                  </span>
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={drafts[staff.id] ?? ""}
                    placeholder="—"
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [staff.id]: event.target.value,
                      }))
                    }
                    onBlur={(event) => applyOrder(staff, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    className="h-11 w-16 shrink-0 rounded-xl px-2 text-center text-lg font-semibold tabular-nums"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        staff.id === nextStaffId && "text-blue-600 dark:text-blue-400",
                      )}
                    >
                      {staff.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      walk-in {staff.walkInCount}
                      {staff.inService ? " · in service" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <AppButton
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-lg"
                      disabled={
                        saving || Boolean(adjustingId) || staff.walkInCount <= 0
                      }
                      aria-label={`Decrease walk-ins for ${staff.name}`}
                      onClick={() => void bumpWalkInCount(staff.id, -1)}
                    >
                      <Minus className="size-4" />
                    </AppButton>
                    <p className="w-10 text-center text-sm font-semibold tabular-nums">
                      {staff.walkInCount}
                    </p>
                    <AppButton
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-lg"
                      disabled={saving || Boolean(adjustingId)}
                      aria-label={`Increase walk-ins for ${staff.name}`}
                      onClick={() => void bumpWalkInCount(staff.id, 1)}
                    >
                      <Plus className="size-4" />
                    </AppButton>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <AppButton
            type="button"
            className="mt-4 h-11 w-full rounded-xl"
            disabled={saving || Boolean(adjustingId) || working.length === 0}
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
