"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  CategoryFilter,
  ServiceCard,
  ServiceForm,
  ServiceTable,
} from "@/components/services";
import {
  SERVICE_CATEGORIES,
  archiveService,
  createService,
  deleteService,
  deleteServices,
  duplicateService,
  updateService,
  type SalonService,
  type ServiceCategory,
  type ServiceInput,
  type ServiceStaffMember,
} from "@/features/salon-services";
import { cn } from "@/lib/utils";

type ServicesManagerProps = {
  salonId: string;
  initialServices: SalonService[];
  staffOptions: ServiceStaffMember[];
};

type DialogMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; service: SalonService };

export function ServicesManager({
  salonId,
  initialServices,
  staffOptions,
}: ServicesManagerProps) {
  const [services, setServices] = useState(initialServices);
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<DialogMode>({ type: "closed" });
  const [bulkCategory, setBulkCategory] = useState<ServiceCategory>("Hair Cut");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services
      .filter((s) => s.status !== "archived")
      .filter((s) => (category === "all" ? true : s.category === category))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          String(s.price).includes(q) ||
          `$${s.price}`.includes(q)
        );
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [services, category, search]);

  const counts = useMemo(() => {
    const visible = services.filter((s) => s.status !== "archived");
    const map: Partial<Record<ServiceCategory | "all", number>> = {
      all: visible.length,
    };
    for (const cat of SERVICE_CATEGORIES) {
      map[cat] = visible.filter((s) => s.category === cat).length;
    }
    return map;
  }, [services]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? filtered.map((s) => s.id) : []);
  }

  async function handleCreate(input: ServiceInput) {
    const created = await createService({
      salonId,
      input,
      existing: services,
    });
    setServices((prev) => [...prev, created]);
    setDialog({ type: "closed" });
  }

  async function handleEdit(input: ServiceInput) {
    if (dialog.type !== "edit") return;
    const updated = await updateService(dialog.service, input);
    setServices((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
    setDialog({ type: "closed" });
  }

  async function handleDuplicate(service: SalonService) {
    const copy = await duplicateService(service);
    setServices((prev) => [...prev, copy]);
  }

  async function handleArchive(service: SalonService) {
    const archived = await archiveService(service);
    setServices((prev) =>
      prev.map((s) => (s.id === archived.id ? archived : s)),
    );
    setSelectedIds((prev) => prev.filter((id) => id !== service.id));
  }

  async function handleDelete(service: SalonService) {
    if (!window.confirm(`Delete “${service.name}”? This cannot be undone.`)) {
      return;
    }
    const next = await deleteService(services, service.id);
    setServices(next);
    setSelectedIds((prev) => prev.filter((id) => id !== service.id));
  }

  async function bulkEnable(enabled: boolean) {
    const next = await Promise.all(
      services.map(async (service) => {
        if (!selectedIds.includes(service.id)) return service;
        return updateService(service, {
          status: enabled ? "active" : "inactive",
          bookingEnabled: enabled ? service.bookingEnabled : false,
        });
      }),
    );
    setServices(next);
  }

  async function bulkDelete() {
    if (
      !window.confirm(
        `Delete ${selectedIds.length} service${selectedIds.length === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }
    const next = await deleteServices(services, selectedIds);
    setServices(next);
    setSelectedIds([]);
  }

  async function bulkChangeCategory() {
    const next = await Promise.all(
      services.map(async (service) => {
        if (!selectedIds.includes(service.id)) return service;
        return updateService(service, { category: bulkCategory });
      }),
    );
    setServices(next);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Catalogue
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
            Services
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Manage every service your salon offers — durations power booking
            slots.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ type: "create" })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
        >
          <Plus className="size-4" />
          Add service
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
              placeholder="Search by name, category, or price…"
              className="h-11 w-full rounded-full border border-neutral-200 bg-[#FAFBFC] pl-10 pr-4 text-[14px] outline-none transition focus:border-neutral-300 focus:bg-white focus:ring-4 focus:ring-neutral-950/5"
            />
          </label>
          <p className="text-[13px] text-neutral-500 lg:shrink-0">
            {filtered.length} service{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        <CategoryFilter
          value={category}
          onChange={setCategory}
          counts={counts}
        />

        {selectedIds.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-[#FAFBFC] p-3 sm:flex-row sm:flex-wrap sm:items-center">
            <p className="text-[13px] font-semibold text-neutral-800">
              {selectedIds.length} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <BulkButton onClick={() => bulkEnable(true)}>Enable</BulkButton>
              <BulkButton onClick={() => bulkEnable(false)}>Disable</BulkButton>
              <BulkButton danger onClick={bulkDelete}>
                Delete
              </BulkButton>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-full border border-neutral-200 bg-white px-3 text-[12px] font-medium"
                  value={bulkCategory}
                  onChange={(e) =>
                    setBulkCategory(e.target.value as ServiceCategory)
                  }
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <BulkButton onClick={bulkChangeCategory}>
                  Change category
                </BulkButton>
              </div>
            </div>
            <button
              type="button"
              className="sm:ml-auto"
              onClick={() => setSelectedIds([])}
              aria-label="Clear selection"
            >
              <X className="size-4 text-neutral-400" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="hidden md:block">
        <ServiceTable
          services={filtered}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={(service) => setDialog({ type: "edit", service })}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            selected={selectedIds.includes(service.id)}
            onSelectChange={(checked) => {
              setSelectedIds((prev) =>
                checked
                  ? [...prev, service.id]
                  : prev.filter((id) => id !== service.id),
              );
            }}
            onEdit={(s) => setDialog({ type: "edit", service: s })}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        ))}
        {filtered.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-neutral-300 bg-white px-5 py-14 text-center text-[14px] text-neutral-500">
            No services match your filters.
          </div>
        ) : null}
      </div>

      {dialog.type !== "closed" ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-neutral-200 bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight text-neutral-950">
                  {dialog.type === "create" ? "Add new service" : "Edit service"}
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500">
                  Required: name, duration, and price.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                onClick={() => setDialog({ type: "closed" })}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <ServiceForm
              initial={dialog.type === "edit" ? dialog.service : null}
              staffOptions={staffOptions}
              submitLabel={
                dialog.type === "create" ? "Create service" : "Save changes"
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

function BulkButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full border px-3.5 text-[12px] font-semibold transition",
        danger
          ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
          : "border-neutral-200 bg-white text-neutral-800 hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
