import type { PlatformTenantStatus } from "../types";

const statusStyles: Record<PlatformTenantStatus, string> = {
  active:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50",
  pending:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50",
  suspended:
    "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50",
};

const statusLabels: Record<PlatformTenantStatus, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
};

interface PlatformTenantStatusBadgeProps {
  status: PlatformTenantStatus;
}

export function PlatformTenantStatusBadge({
  status,
}: PlatformTenantStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
