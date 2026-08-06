"use client";

import { useCallback } from "react";

import { toast } from "@/components/common";
import {
  useStaffPresenceRealtime,
  type StaffPresencePayload,
} from "@/features/staff/lib/staff-presence-realtime";
import { useTenant } from "@/features/tenants";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Toast when a staff member signs in (or out) via room/staff PIN,
 * so admins see it without staying on /admin/staff.
 */
export function AdminStaffPresenceWatcher() {
  const tenant = useTenant();
  const isMobile = useIsMobile();

  const onPresence = useCallback(
    (payload: StaffPresencePayload) => {
      const roomBit = payload.roomName ? ` · ${payload.roomName}` : "";
      if (payload.type === "online") {
        toast.success("Staff signed in", {
          description: `${payload.staffName}${roomBit}`,
          position: isMobile ? "top-center" : "top-right",
          duration: 6_000,
        });
        return;
      }

      toast.message("Staff signed out", {
        description: `${payload.staffName}${roomBit}`,
        position: isMobile ? "top-center" : "top-right",
        duration: 4_000,
      });
    },
    [isMobile],
  );

  useStaffPresenceRealtime(tenant.slug, onPresence);

  return null;
}
