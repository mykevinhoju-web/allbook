"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, ListOrdered } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
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

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (!item) return list;
  next.splice(to, 0, item);
  return next;
}

export function AdminRotationContent() {
  const tenant = useOptionalTenant();
  const timeZone = tenant?.settings.timezone || "Australia/Sydney";
  const today = todayDateInZone(timeZone);
  const [date, setDate] = useState(today);
  const [working, setWorking] = useState<WorkingStaff[]>([]);
  const [rotation, setRotation] = useState<RotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminApi(`/api/admin/rotation?date=${date}`);
      const data = (await response.json()) as RotationResponse;
      if (!response.ok) {
        toast.error("Could not load rotation", {
          description: data.error ?? "Try again.",
        });
        return;
      }
      setWorking(data.working ?? []);
      setRotation(data.rotation ?? []);
    } catch {
      toast.error("Could not load rotation");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (next = rotation) => {
    setSaving(true);
    try {
      const response = await fetchAdminApi("/api/admin/rotation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
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

  const addStaff = (staff: WorkingStaff) => {
    if (rotation.some((row) => row.staffId === staff.id)) return;
    setRotation((current) => [
      ...current,
      {
        staffId: staff.id,
        name: staff.name,
        sortOrder: current.length + 1,
        inService: staff.inService,
        walkInCount: staff.walkInCount,
      },
    ]);
  };

  const addAllWorking = () => {
    setRotation((current) => {
      const existing = new Set(current.map((row) => row.staffId));
      const extra = working
        .filter((staff) => !existing.has(staff.id))
        .map((staff, index) => ({
          staffId: staff.id,
          name: staff.name,
          sortOrder: current.length + index + 1,
          inService: staff.inService,
          walkInCount: staff.walkInCount,
        }));
      return [...current, ...extra];
    });
  };

  const available = working.filter(
    (staff) => !rotation.some((row) => row.staffId === staff.id),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:p-6">
      <AdminPageHeader
        title="Rotation"
        description="Set today's walk-in order. Busy staff are skipped, then catch up on the next guest."
      />

      <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Date</span>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 w-44 rounded-xl"
            />
          </label>
          <AppButton
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => setDate(today)}
          >
            Today
          </AppButton>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Today&apos;s order</p>
                <p className="text-xs text-muted-foreground">
                  Walk-in guests without a chosen staff member follow this list.
                </p>
              </div>
              <ListOrdered className="size-4 text-muted-foreground" />
            </div>

            {rotation.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                No rotation yet. Add staff who are working today.
              </p>
            ) : (
              <ul className="space-y-2">
                {rotation.map((row, index) => (
                  <li
                    key={row.staffId}
                    className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2"
                  >
                    <span className="w-7 text-sm font-semibold tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.walkInCount} walk-in
                        {row.walkInCount === 1 ? "" : "s"}
                        {row.inService ? " · in service" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <AppButton
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-9 rounded-lg"
                        disabled={index === 0}
                        onClick={() =>
                          setRotation((current) => moveItem(current, index, index - 1))
                        }
                      >
                        <ChevronUp className="size-4" />
                      </AppButton>
                      <AppButton
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-9 rounded-lg"
                        disabled={index === rotation.length - 1}
                        onClick={() =>
                          setRotation((current) => moveItem(current, index, index + 1))
                        }
                      >
                        <ChevronDown className="size-4" />
                      </AppButton>
                      <AppButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-lg"
                        onClick={() =>
                          setRotation((current) =>
                            current.filter((item) => item.staffId !== row.staffId),
                          )
                        }
                      >
                        Remove
                      </AppButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <AppButton
              type="button"
              className="mt-4 h-11 w-full rounded-xl"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save rotation"}
            </AppButton>
          </section>

          <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Working today</p>
                <p className="text-xs text-muted-foreground">
                  Only on-shift staff can be added.
                </p>
              </div>
              {available.length > 0 ? (
                <AppButton
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={addAllWorking}
                >
                  Add all
                </AppButton>
              ) : null}
            </div>

            {working.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No staff have a shift on this day.
              </p>
            ) : available.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Everyone working today is already in the rotation.
              </p>
            ) : (
              <ul className="space-y-2">
                {available.map((staff) => (
                  <li
                    key={staff.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{staff.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {staff.walkInCount} walk-in
                        {staff.walkInCount === 1 ? "" : "s"}
                        {staff.inService ? " · in service" : ""}
                      </p>
                    </div>
                    <AppButton
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn("rounded-xl")}
                      onClick={() => addStaff(staff)}
                    >
                      Add
                    </AppButton>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
