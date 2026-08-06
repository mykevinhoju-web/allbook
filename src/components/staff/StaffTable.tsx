"use client";

import {
  Archive,
  Copy,
  MoreHorizontal,
  Pencil,
  Power,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { SalonStaffMember } from "@/features/salon-staff";
import { cn } from "@/lib/utils";

type StaffTableProps = {
  staff: SalonStaffMember[];
  onEdit: (member: SalonStaffMember) => void;
  onDuplicate: (member: SalonStaffMember) => void;
  onArchive: (member: SalonStaffMember) => void;
  onRestore: (member: SalonStaffMember) => void;
  onActivate: (member: SalonStaffMember) => void;
  onDeactivate: (member: SalonStaffMember) => void;
  className?: string;
};

export function StaffTable({
  staff,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onActivate,
  onDeactivate,
  className,
}: StaffTableProps) {
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
              <th className="px-5 py-3 font-semibold">Staff</th>
              <th className="px-3 py-3 font-semibold">Role</th>
              <th className="px-3 py-3 font-semibold">Phone</th>
              <th className="px-3 py-3 font-semibold">Email</th>
              <th className="px-3 py-3 font-semibold">Services</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <StaffRow
                key={member.id}
                member={member}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onArchive={onArchive}
                onRestore={onRestore}
                onActivate={onActivate}
                onDeactivate={onDeactivate}
              />
            ))}
            {staff.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-16 text-center text-[14px] text-neutral-500"
                >
                  No staff match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StaffRow({
  member,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onActivate,
  onDeactivate,
}: {
  member: SalonStaffMember;
  onEdit: (member: SalonStaffMember) => void;
  onDuplicate: (member: SalonStaffMember) => void;
  onArchive: (member: SalonStaffMember) => void;
  onRestore: (member: SalonStaffMember) => void;
  onActivate: (member: SalonStaffMember) => void;
  onDeactivate: (member: SalonStaffMember) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isArchived = member.status === "archived";

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <tr className="border-t border-neutral-100 transition hover:bg-[#FAFBFC]">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photo}
              alt=""
              className="size-9 rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-950 text-[11px] font-semibold text-white">
              {member.displayName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
          <div>
            <p className="font-medium text-neutral-900">{member.displayName}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3.5 text-neutral-600">{member.role}</td>
      <td className="px-3 py-3.5 text-neutral-600">{member.phone || "—"}</td>
      <td className="max-w-[200px] truncate px-3 py-3.5 text-neutral-600">
        {member.email || "—"}
      </td>
      <td className="max-w-[180px] truncate px-3 py-3.5 text-neutral-600">
        {member.services.map((s) => s.name).join(", ") || "—"}
      </td>
      <td className="px-3 py-3.5">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
            member.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : member.status === "archived"
                ? "bg-amber-50 text-amber-800"
                : "bg-neutral-100 text-neutral-600",
          )}
        >
          {member.status === "active"
            ? "Active"
            : member.status === "archived"
              ? "Archived"
              : "Inactive"}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="relative inline-block" ref={menuRef}>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={`Actions for ${member.displayName}`}
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 text-left shadow-lg">
              {!isArchived ? (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(member);
                    }}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(member);
                    }}
                  >
                    <Copy className="size-3.5" /> Duplicate
                  </button>
                  {member.status === "active" ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-50"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeactivate(member);
                      }}
                    >
                      <Power className="size-3.5" /> Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-50"
                      onClick={() => {
                        setMenuOpen(false);
                        onActivate(member);
                      }}
                    >
                      <Power className="size-3.5" /> Activate
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onArchive(member);
                    }}
                  >
                    <Archive className="size-3.5" /> Archive
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onRestore(member);
                  }}
                >
                  <RotateCcw className="size-3.5" /> Restore
                </button>
              )}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
