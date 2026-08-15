"use client";

import Link from "next/link";
import {
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { AppAvatar, AppButton } from "@/components/common";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { AdminStaffRow } from "../types";
import { StaffPresenceBadge } from "./staff-presence-badge";

interface StaffMobileListProps {
  staff: AdminStaffRow[];
  onDelete: (id: string) => void;
}

export function StaffMobileList({ staff, onDelete }: StaffMobileListProps) {
  if (staff.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2 lg:hidden">
      {staff.map((member) => (
        <li key={member.id}>
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3.5 shadow-soft",
              member.presence === "online" || member.presence === "in_service"
                ? "border-emerald-500/30 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-950/25"
                : "border-border/40 bg-card",
            )}
          >
            <Link
              href={`/admin/staff/${member.id}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <AppAvatar
                src={member.photoUrl}
                alt={member.name}
                size="lg"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{member.name}</p>
                  <StaffPresenceBadge
                    presence={member.presence}
                    roomName={member.currentRoomName}
                  />
                </div>
                <p
                  className={cn(
                    "mt-0.5 text-sm",
                    member.workingToday
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground",
                  )}
                >
                  {member.workingToday
                    ? (member.shiftLabel ?? "Working today")
                    : "Off today"}
                </p>
                {member.nextBooking ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Next: {member.nextBooking}
                  </p>
                ) : null}
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <AppButton
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    aria-label="Staff actions"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  render={
                    <Link
                      href={`/admin/staff/${member.id}`}
                      className="flex items-center gap-2"
                    />
                  }
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(member.id)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </li>
      ))}
    </ul>
  );
}
