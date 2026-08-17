"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { AppAvatar, AppButton, ConfirmDialog, toast } from "@/components/common";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";

import type { AdminStaffRow } from "../types";
import { StaffPresenceBadge } from "./staff-presence-badge";

interface StaffTableProps {
  staff: AdminStaffRow[];
  onChanged?: () => void;
}

export function StaffTable({ staff, onChanged }: StaffTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const response = await fetchAdminApi(`/api/admin/staff/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete staff.");
      }

      toast.success("Staff deleted");
      onChanged?.();
    } catch (error) {
      toast.error("Could not delete staff", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const columns: DataTableColumn<AdminStaffRow>[] = [
    {
      key: "photo",
      header: "Photo",
      className: "w-16",
      cell: (row) => (
        <AppAvatar
          src={row.photoUrl}
          alt={row.name}
          size="sm"
          className="ring-2 ring-background"
        />
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <Link
          href={`/admin/staff/${row.id}`}
          className="font-medium text-foreground hover:text-primary"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StaffPresenceBadge
          presence={row.presence}
          roomName={row.currentRoomName}
        />
      ),
    },
    {
      key: "workingToday",
      header: "Working Today",
      className: "hidden sm:table-cell",
      cell: (row) => (
        <span
          className={cn(
            "text-sm font-medium",
            row.workingToday
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground",
          )}
        >
          {row.workingToday ? (row.shiftLabel ?? "Working") : "Off"}
        </span>
      ),
    },
    {
      key: "nextBooking",
      header: "Next Booking",
      className: "hidden md:table-cell",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.nextBooking ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <AppButton variant="ghost" size="icon" aria-label="Staff actions" />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={
                <Link href={`/admin/staff/${row.id}`} className="flex items-center gap-2" />
              }
            >
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteId(row.id)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={staff}
        getRowKey={(row) => row.id}
        getRowClassName={(row) =>
          row.presence === "online" || row.presence === "in_service"
            ? "bg-emerald-50/80 dark:bg-emerald-950/25"
            : undefined
        }
        emptyTitle="No staff found"
        emptyDescription="Try adjusting your search or filters, or add a new staff member."
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete staff member?"
        description="Removes this person from the staff list and PIN login. Past bookings stay on reports."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
