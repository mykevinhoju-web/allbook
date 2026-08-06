"use client";

import {
  Archive,
  Copy,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  formatDurationLabel,
  formatServicePrice,
  type SalonService,
} from "@/features/salon-services";
import { cn } from "@/lib/utils";

type ServiceTableProps = {
  services: SalonService[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onEdit: (service: SalonService) => void;
  onDuplicate: (service: SalonService) => void;
  onArchive: (service: SalonService) => void;
  onRestore?: (service: SalonService) => void;
  onDelete: (service: SalonService) => void;
  emptyLabel?: string;
  className?: string;
};

export function ServiceTable({
  services,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
  emptyLabel = "No services match your filters.",
  className,
}: ServiceTableProps) {
  const allSelected =
    services.length > 0 && services.every((s) => selectedIds.includes(s.id));

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[13px]">
          <thead className="bg-[#FAFBFC] text-[11px] uppercase tracking-[0.08em] text-neutral-500">
            <tr>
              <th className="px-4 py-3 sm:px-5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  aria-label="Select all services"
                />
              </th>
              <th className="px-3 py-3 font-semibold">Service</th>
              <th className="px-3 py-3 font-semibold">Category</th>
              <th className="px-3 py-3 font-semibold">Duration</th>
              <th className="px-3 py-3 font-semibold">Price</th>
              <th className="px-3 py-3 font-semibold">Staff</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold sm:px-5">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                selected={selectedIds.includes(service.id)}
                onToggleSelect={() => onToggleSelect(service.id)}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            ))}
            {services.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-16 text-center text-[14px] text-neutral-500"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServiceRow({
  service,
  selected,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}: {
  service: SalonService;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: (service: SalonService) => void;
  onDuplicate: (service: SalonService) => void;
  onArchive: (service: SalonService) => void;
  onRestore?: (service: SalonService) => void;
  onDelete: (service: SalonService) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <tr className="border-t border-neutral-100 transition hover:bg-[#FAFBFC]">
      <td className="px-4 py-3.5 sm:px-5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select ${service.name}`}
        />
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">{service.name}</span>
          {service.featured ? (
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
          ) : null}
        </div>
        {service.bookingEnabled ? (
          <p className="mt-0.5 text-[11px] text-emerald-600">Online booking</p>
        ) : (
          <p className="mt-0.5 text-[11px] text-neutral-400">Booking off</p>
        )}
      </td>
      <td className="px-3 py-3.5 text-neutral-600">{service.category}</td>
      <td className="px-3 py-3.5 tabular-nums text-neutral-700">
        {formatDurationLabel(service.duration)}
      </td>
      <td className="px-3 py-3.5 tabular-nums text-neutral-700">
        {formatServicePrice({
          price: service.price,
          priceMax: service.priceMax,
          priceType: service.priceType,
        })}
      </td>
      <td className="max-w-[180px] truncate px-3 py-3.5 text-neutral-600">
        {service.staff.map((s) => s.name).join(", ") || "—"}
      </td>
      <td className="px-3 py-3.5">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
            service.status === "active" && "bg-emerald-50 text-emerald-700",
            service.status === "inactive" && "bg-neutral-100 text-neutral-600",
            service.status === "archived" && "bg-amber-50 text-amber-800",
          )}
        >
          {service.status === "active"
            ? "Active"
            : service.status === "archived"
              ? "Archived"
              : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right sm:px-5">
        <div className="relative inline-block" ref={menuRef}>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label={`Actions for ${service.name}`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 text-left shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(service);
                }}
              >
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(service);
                }}
              >
                <Copy className="size-3.5" /> Duplicate
              </button>
              {service.status === "archived" ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onRestore?.(service);
                  }}
                >
                  <Archive className="size-3.5" /> Restore
                </button>
              ) : (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive(service);
                  }}
                >
                  <Archive className="size-3.5" /> Archive
                </button>
              )}
              {service.status !== "archived" ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(service);
                }}
              >
                <Trash2 className="size-3.5" /> Archive
              </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
