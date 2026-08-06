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
  STAFF_DAY_LABELS,
  type SalonStaffMember,
} from "@/features/salon-staff";
import { cn } from "@/lib/utils";

type StaffCardProps = {
  member: SalonStaffMember;
  onEdit: (member: SalonStaffMember) => void;
  onDuplicate: (member: SalonStaffMember) => void;
  onArchive: (member: SalonStaffMember) => void;
  onDelete: (member: SalonStaffMember) => void;
};

export function StaffCard({
  member,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: StaffCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const working = member.workingHours.filter((d) => !d.isDayOff);

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
                <Menu
                  onEdit={() => {
                    setMenuOpen(false);
                    onEdit(member);
                  }}
                  onDuplicate={() => {
                    setMenuOpen(false);
                    onDuplicate(member);
                  }}
                  onArchive={() => {
                    setMenuOpen(false);
                    onArchive(member);
                  }}
                  onDelete={() => {
                    setMenuOpen(false);
                    onDelete(member);
                  }}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            <Chip tone={member.status === "active" ? "good" : "muted"}>
              {member.status === "active" ? "Active" : "Inactive"}
            </Chip>
            <Chip>
              <Star className="mr-1 inline size-3 fill-amber-400 text-amber-400" />
              {member.rating.toFixed(1)}
            </Chip>
            <Chip>{member.experience} yrs</Chip>
            <Chip tone={member.bookingEnabled ? "good" : "muted"}>
              {member.bookingEnabled ? "Bookable" : "Booking off"}
            </Chip>
          </div>

          <p className="mt-3 truncate text-[12px] text-neutral-500">
            {member.languages.join(" · ") || "No languages"}
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

function Menu({
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-50" onClick={onEdit}>
        <Pencil className="size-3.5" /> Edit
      </button>
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-50" onClick={onDuplicate}>
        <Copy className="size-3.5" /> Duplicate
      </button>
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-50" onClick={onArchive}>
        <Archive className="size-3.5" /> Archive
      </button>
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-rose-600 hover:bg-rose-50" onClick={onDelete}>
        <Trash2 className="size-3.5" /> Delete
      </button>
    </div>
  );
}
