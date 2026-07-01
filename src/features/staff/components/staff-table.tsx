"use client";

import { MoreHorizontal } from "lucide-react";

import { AppAvatar, AppButton } from "@/components/common";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { cn } from "@/lib/utils";

import type { AdminStaffRow } from "../types";
import { StaffStatusBadge } from "./staff-status-badge";

interface StaffTableProps {
  staff: AdminStaffRow[];
}

export function StaffTable({ staff }: StaffTableProps) {
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
        <span className="font-medium text-foreground">{row.name}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StaffStatusBadge status={row.status} />,
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
          {row.workingToday ? "Yes" : "No"}
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
      cell: () => (
        <AppButton variant="ghost" size="icon" aria-label="Staff actions">
          <MoreHorizontal className="size-4" />
        </AppButton>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={staff}
      getRowKey={(row) => row.id}
      emptyTitle="No staff found"
      emptyDescription="Try adjusting your search or filters, or add a new staff member."
    />
  );
}
