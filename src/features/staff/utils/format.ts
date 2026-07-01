import type { StaffStatus } from "../types";

const staffStatusLabels: Record<StaffStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
};

export function getStaffStatusLabel(status: StaffStatus): string {
  return staffStatusLabels[status];
}

export function getStaffStatusBadgeVariant(
  status: StaffStatus,
): "active" | "inactive" | "suspended" {
  if (status === "active") return "active";
  if (status === "on_leave") return "suspended";
  return "inactive";
}
