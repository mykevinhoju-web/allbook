"use client";

import Link from "next/link";
import { ExternalLink, MoreHorizontal } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { platformConfig } from "@/config/site";
import type { PlatformTenantRow } from "@/features/platform/types";
import { getTenantAdminUrl, getTenantPublicUrl } from "@/features/tenants";

import { formatPlatformDate } from "../utils/navigation";
import { PlatformTenantStatusBadge } from "./platform-tenant-status-badge";

interface SignupsTableProps {
  tenants: PlatformTenantRow[];
  title?: string;
  description?: string;
  showViewAll?: boolean;
}

export function SignupsTable({
  tenants,
  title = "Signups",
  description = `Businesses that joined ${platformConfig.name}.`,
  showViewAll = false,
}: SignupsTableProps) {
  const columns: DataTableColumn<PlatformTenantRow>[] = [
    {
      key: "name",
      header: "Business",
      cell: (row) => (
        <div className="min-w-[140px]">
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      cell: (row) => (
        <div className="min-w-[140px]">
          <p className="font-medium text-foreground">{row.ownerName}</p>
          <p className="text-xs text-muted-foreground">{row.ownerEmail}</p>
        </div>
      ),
    },
    {
      key: "ownerPhone",
      header: "Contact",
      className: "hidden md:table-cell",
      cell: (row) => (
        <span className="text-muted-foreground">{row.ownerPhone}</span>
      ),
    },
    {
      key: "businessType",
      header: "Type",
      className: "hidden lg:table-cell",
      cell: (row) => (
        <span className="text-foreground">{row.businessType}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <PlatformTenantStatusBadge status={row.status} />,
    },
    {
      key: "subscription",
      header: "Plan",
      className: "hidden sm:table-cell",
      cell: (row) => (
        <span className="text-foreground">{row.subscription}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      className: "hidden sm:table-cell",
      cell: (row) => (
        <span className="text-muted-foreground">
          {formatPlatformDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20 text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={getTenantPublicUrl(row.slug)}
            target="_blank"
            className="inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open booking site"
          >
            <ExternalLink className="size-4" />
          </Link>
          <Link
            href={getTenantAdminUrl(row.slug)}
            target="_blank"
            className="inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open admin dashboard"
          >
            <MoreHorizontal className="size-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {showViewAll ? (
          <Link
            href="/platform/tenants"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all signups
          </Link>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={tenants}
        getRowKey={(row) => row.id}
        emptyTitle="No signups yet"
        emptyDescription="When businesses start a free trial, they will appear here."
      />
    </div>
  );
}
