"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { AppButton, appButtonVariants } from "@/components/common";
import { cn } from "@/lib/utils";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { platformConfig } from "@/config/site";
import type { PlatformTenantRow } from "@/features/platform/types";

import { formatPlatformDate } from "../utils/navigation";
import { PlatformTenantStatusBadge } from "./platform-tenant-status-badge";

interface RecentTenantsTableProps {
  tenants: PlatformTenantRow[];
}

export function RecentTenantsTable({ tenants }: RecentTenantsTableProps) {
  const columns: DataTableColumn<PlatformTenantRow>[] = [
    {
      key: "name",
      header: "Tenant",
      cell: (row) => (
        <div className="min-w-[140px]">
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.slug}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <PlatformTenantStatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Created Date",
      className: "hidden sm:table-cell",
      cell: (row) => (
        <span className="text-muted-foreground">
          {formatPlatformDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "subscription",
      header: "Subscription",
      className: "hidden md:table-cell",
      cell: (row) => (
        <span className="text-foreground">{row.subscription}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: () => (
        <AppButton variant="ghost" size="icon" aria-label="Tenant actions">
          <MoreHorizontal className="size-4" />
        </AppButton>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Recent Tenants
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage organizations on the {platformConfig.name} platform.
          </p>
        </div>
        <Link
          href="/platform/tenants"
          className={cn(appButtonVariants({ variant: "primary" }))}
        >
          Create Tenant
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={tenants}
        getRowKey={(row) => row.id}
        emptyTitle="No tenants yet"
        emptyDescription="Create your first tenant to get started."
      />
    </div>
  );
}
