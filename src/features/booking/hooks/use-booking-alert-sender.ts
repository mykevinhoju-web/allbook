"use client";

import { useState } from "react";

import { toast } from "@/components/common";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOptionalTenant } from "@/features/tenants";

import { broadcastNewBooking } from "../lib/booking-realtime";
import type { BookingStaffItem } from "../config/booking-staff-mock";

export function useBookingAlertSender() {
  const tenant = useOptionalTenant();
  const isMobile = useIsMobile();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const sendBookingRequest = async (staff: BookingStaffItem) => {
    if (!tenant || !staff.available) return;

    setSendingId(staff.id);

    try {
      await broadcastNewBooking(tenant.slug, {
        staffId: staff.id,
        staffName: staff.name,
        requestedAt: new Date().toISOString(),
      });

      toast.success("Request sent", {
        description: `Booking request for ${staff.name}`,
        position: isMobile ? "top-center" : "top-right",
      });
    } catch {
      toast.error("Could not send request", {
        description: "Check your connection and try again.",
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setSendingId(null);
    }
  };

  return {
    sendBookingRequest,
    sendingId,
    canSend: Boolean(tenant),
  };
}
