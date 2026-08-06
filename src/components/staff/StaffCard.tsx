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

import {
  STAFF_DAY_LABELS,
  type SalonStaffMember,
} from "@/features/salon-staff";
import { cn } from "@/lib/utils";

type StaffCardProps = {
  member: SalonStaffMember;
  onEdit: (member: SalonStaffMember) => void;
  onDuplicate: (member: SalonStaffMember) => void;
  onArchive: (member: SalonStaffMember) => void;
  onRestore: (member: SalonStaffMember) => void;
  onActivate: (member: SalonStaffMember) => void;
  onDeactivate: (member: SalonStaffMember) => void;
};

export function StaffCard({
  member,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onActivate,
  onDeactivate,
}: StaffCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const working = member.workingHours.filter((d) => !d.isDayOff);
  const isArchived = member.status === "archived";

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <article className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-neutral-300">
      <div className="flex items-start gap-3">
        <Avatar name={member.displayName} photo={member.photo} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[15px] font-semibold text-neutral-950">
                {member.displayName}
              </h3>
              <p className="text-[12px] text-neutral-500">{member.role}</p>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Staff actions"
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                  {isArchived ? (
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
                  ) : (
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
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            <Chip
              tone={
                member.status === "active"
                  ? "good"
                  : member.status === "archived"
                    ? "muted"
                    : "muted"
              }
            >
              {member.status === "active"
                ? "Active"
                : member.status === "archived"
                  ? "Archived"
                  : "Inactive"}
            </Chip>
          </div>

          <p className="mt-3 truncate text-[12px] text-neutral-500">
            {member.phone || "No phone"}
          </p>
          <p className="mt-1 truncate text-[12px] text-neutral-500">
            {member.email || "No email"}
          </p>
          <p className="mt-1 truncate text-[12px] text-neutral-500">
            {working.length
              ? working
                  .map((d) => STAFF_DAY_LABELS[d.dayOfWeek].slice(0, 3))
                  .join(", ")
              : "No working days"}
          </p>
          <p className="mt-1 truncate text-[12px] text-neutral-500">
            {member.services.map((s) => s.name).join(" · ") || "No services"}
          </p>
        </div>
      </div>
    </article>
  );
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        className="size-12 rounded-2xl object-cover ring-1 ring-neutral-200"
      />
    );
  }
  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-[12px] font-semibold text-white">
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")}
    </div>
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
        "inline-flex items-center rounded-full px-2.5 py-1 font-medium",
        tone === "default" && "bg-neutral-100 text-neutral-700",
        tone === "good" && "bg-emerald-50 text-emerald-700",
        tone === "muted" && "bg-neutral-50 text-neutral-500",
      )}
    >
      {children}
    </span>
  );
}
