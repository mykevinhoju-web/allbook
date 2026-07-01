import { StatusBadge } from "@/components/common";

import type { StaffStatus } from "../types";
import { getStaffStatusBadgeVariant, getStaffStatusLabel } from "../utils/format";

interface StaffStatusBadgeProps {
  status: StaffStatus;
}

export function StaffStatusBadge({ status }: StaffStatusBadgeProps) {
  return (
    <StatusBadge
      status={getStaffStatusBadgeVariant(status)}
      label={getStaffStatusLabel(status)}
    />
  );
}
