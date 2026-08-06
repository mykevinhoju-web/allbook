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

type ServiceCardProps = {
  service: SalonService;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onEdit: (service: SalonService) => void;
  onDuplicate: (service: SalonService) => void;
  onArchive: (service: SalonService) => void;
  onRestore?: (service: SalonService) => void;
  onDelete: (service: SalonService) => void;
};

export function ServiceCard({
  service,
  selected = false,
  onSelectChange,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}: ServiceCardProps) {
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
    <article
      className={cn(
        "rounded-[22px] border bg-white p-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.45)] transition duration-300",
        "hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_22px_44px_-28px_rgba(15,23,42,0.5)]",
        selected ? "border-neutral-950" : "border-neutral-200/80",
      )}
    >
      <div className="flex items-start gap-3">
        {onSelectChange ? (
          <input
            type="checkbox"
            className="mt-1"
            checked={selected}
            onChange={(e) => onSelectChange(e.target.checked)}
            aria-label={`Select ${service.name}`}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[15px] font-semibold text-neutral-950">
                  {service.name}
                </h3>
                {service.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    <Star className="size-3 fill-amber-500 text-amber-500" />
                    Featured
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[12px] text-neutral-500">
                {service.category}
              </p>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Service actions"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                  <ActionItem
                    icon={Pencil}
                    label="Edit"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(service);
                    }}
                  />
                  <ActionItem
                    icon={Copy}
                    label="Duplicate"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(service);
                    }}
                  />
                  {service.status === "archived" ? (
                    <ActionItem
                      icon={Archive}
                      label="Restore"
                      onClick={() => {
                        setMenuOpen(false);
                        onRestore?.(service);
                      }}
                    />
                  ) : (
                    <ActionItem
                      icon={Archive}
                      label="Archive"
                      onClick={() => {
                        setMenuOpen(false);
                        onArchive(service);
                      }}
                    />
                  )}
                  {service.status !== "archived" ? (
                    <ActionItem
                      icon={Trash2}
                      label="Archive"
                      danger
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(service);
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            <Chip>{formatDurationLabel(service.duration)}</Chip>
            <Chip>
              {formatServicePrice({
                price: service.price,
                priceMax: service.priceMax,
                priceType: service.priceType,
              })}
            </Chip>
            <Chip
              tone={
                service.status === "active"
                  ? "good"
                  : service.status === "archived"
                    ? "muted"
                    : "muted"
              }
            >
              {service.status === "active"
                ? "Active"
                : service.status === "archived"
                  ? "Archived"
                  : "Inactive"}
            </Chip>
            {service.bookingEnabled ? (
              <Chip tone="good">Online booking</Chip>
            ) : (
              <Chip tone="muted">Booking off</Chip>
            )}
          </div>

          {service.staff.length > 0 ? (
            <p className="mt-3 truncate text-[12px] text-neutral-500">
              {service.staff.map((s) => s.name).join(" · ")}
            </p>
          ) : (
            <p className="mt-3 text-[12px] text-neutral-400">No staff assigned</p>
          )}
        </div>
      </div>
    </article>
  );
}

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "good" | "muted";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 font-medium",
        tone === "default" && "bg-neutral-100 text-neutral-700",
        tone === "good" && "bg-emerald-50 text-emerald-700",
        tone === "muted" && "bg-neutral-50 text-neutral-500",
      )}
    >
      {children}
    </span>
  );
}

function ActionItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition hover:bg-neutral-50",
        danger ? "text-rose-600" : "text-neutral-700",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
