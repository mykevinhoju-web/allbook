"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  StaffCard,
  StaffForm,
  StaffTable,
} from "@/components/staff";
import {
  STAFF_ROLES,
  activateStaff,
  archiveStaff,
  createStaff,
  deactivateStaff,
  duplicateStaff,
  restoreStaff,
  updateStaff,
  type SalonStaffMember,
  type StaffAssignedService,
  type StaffInput,
  type StaffRole,
  type StaffStatus,
} from "@/features/salon-staff";
import { cn } from "@/lib/utils";

type StaffManagerProps = {
  salonId: string;
  initialStaff: SalonStaffMember[];
  serviceOptions: StaffAssignedService[];
};

type DialogMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; member: SalonStaffMember };

export function StaffManager({
  salonId,
  initialStaff,
  serviceOptions,
}: StaffManagerProps) {
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<StaffRole | "all">("all");
  const [status, setStatus] = useState<StaffStatus | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState<DialogMode>({ type: "closed" });
  const [actionError, setActionError] = useState<string | null>(null);

  const activeCount = useMemo(
    () => staff.filter((s) => s.status !== "archived").length,
    [staff],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff
      .filter((s) => (showArchived ? true : s.status !== "archived"))
      .filter((s) => (role === "all" ? true : s.role === role))
      .filter((s) => (status === "all" ? true : s.status === status))
      .filter((s) => {
        if (!q) return true;
        return (
          s.displayName.toLowerCase().includes(q) ||
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q) ||
          s.specialties.some((sp) => sp.toLowerCase().includes(q)) ||
          s.languages.some((l) => l.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [staff, search, role, status, showArchived]);

  async function handleCreate(input: StaffInput) {
    setActionError(null);
    try {
      const created = await createStaff({ salonId, input });
      setStaff((prev) => [...prev, created]);
      setDialog({ type: "closed" });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not create.");
      throw err;
    }
  }

  async function handleEdit(input: StaffInput) {
    if (dialog.type !== "edit") return;
    setActionError(null);
    try {
      const updated = await updateStaff(dialog.member, input);
      setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setDialog({ type: "closed" });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save.");
      throw err;
    }
  }

  async function handleDuplicate(member: SalonStaffMember) {
    setActionError(null);
    try {
      const copy = await duplicateStaff(member);
      setStaff((prev) => [...prev, copy]);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not duplicate.",
      );
    }
  }

  async function handleArchive(member: SalonStaffMember) {
    if (
      !window.confirm(
        `Archive “${member.displayName}”? You can restore them later from archived staff.`,
      )
    ) {
      return;
    }
    setActionError(null);
    try {
      const archived = await archiveStaff(member);
      setStaff((prev) => prev.map((s) => (s.id === archived.id ? archived : s)));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not archive.",
      );
    }
  }

  async function handleRestore(member: SalonStaffMember) {
    setActionError(null);
    try {
      const restored = await restoreStaff(member);
      setStaff((prev) => prev.map((s) => (s.id === restored.id ? restored : s)));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not restore.",
      );
    }
  }

  async function handleActivate(member: SalonStaffMember) {
    setActionError(null);
    try {
      const next = await activateStaff(member);
      setStaff((prev) => prev.map((s) => (s.id === next.id ? next : s)));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not activate.",
      );
    }
  }

  async function handleDeactivate(member: SalonStaffMember) {
    setActionError(null);
    try {
      const next = await deactivateStaff(member);
      setStaff((prev) => prev.map((s) => (s.id === next.id ? next : s)));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not deactivate.",
      );
    }
  }

  const isEmptyTeam = activeCount === 0 && !showArchived;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Team
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
            Staff
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Schedules, services, and booking capacity for every team member.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ type: "create" })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
        >
          <Plus className="size-4" />
          Add staff
        </button>
      </div>

      <div className="space-y-4 rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, phone, email…"
              className="h-11 w-full rounded-full border border-neutral-200 bg-[#FAFBFC] pl-10 pr-4 text-[14px] outline-none transition focus:border-neutral-300 focus:bg-white focus:ring-4 focus:ring-neutral-950/5"
            />
          </label>
          <select
            className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-medium"
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole | "all")}
          >
            <option value="all">All roles</option>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-medium"
            value={status}
            onChange={(e) => setStatus(e.target.value as StaffStatus | "all")}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            {showArchived ? (
              <option value="archived">Archived</option>
            ) : null}
          </select>
          <p className="text-[13px] text-neutral-500 lg:shrink-0">
            {filtered.length} staff
          </p>
          <label className="inline-flex items-center gap-2 text-[13px] text-neutral-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>

        {actionError ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {actionError}
          </p>
        ) : null}
      </div>

      {isEmptyTeam ? (
        <div className="rounded-[24px] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center shadow-sm">
          <h2 className="text-[18px] font-semibold text-neutral-950">
            Add your first staff member
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-neutral-500">
            Add stylists and team members with hours, breaks, leave, and
            services so customers can book them.
          </p>
          <button
            type="button"
            onClick={() => setDialog({ type: "create" })}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
          >
            <Plus className="size-4" />
            Add staff
          </button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <StaffTable
              staff={filtered}
              onEdit={(member) => setDialog({ type: "edit", member })}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
            />
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                onEdit={(m) => setDialog({ type: "edit", member: m })}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
              />
            ))}
            {filtered.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-neutral-300 bg-white px-5 py-14 text-center text-[14px] text-neutral-500">
                No staff match your filters.
              </div>
            ) : null}
          </div>
        </>
      )}

      {dialog.type !== "closed" ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] border border-neutral-200 bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight text-neutral-950">
                  {dialog.type === "create" ? "Add staff" : "Edit staff"}
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500">
                  Working hours, breaks, leave, and services feed the booking
                  engine.
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  "rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700",
                )}
                onClick={() => setDialog({ type: "closed" })}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <StaffForm
              initial={dialog.type === "edit" ? dialog.member : null}
              serviceOptions={serviceOptions}
              submitLabel={
                dialog.type === "create" ? "Create staff" : "Save changes"
              }
              onCancel={() => setDialog({ type: "closed" })}
              onSubmit={dialog.type === "create" ? handleCreate : handleEdit}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
