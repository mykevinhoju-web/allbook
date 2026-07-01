"use client";

import { useState } from "react";

import { toast } from "@/components/common";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOptionalTenant } from "@/features/tenants";

import type { BookingStaffItem } from "../config/booking-staff-mock";

export function useBookingAlertSender() {
  const tenant = useOptionalTenant();
  const isMobile = useIsMobile();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const sendBookingRequest = async (staff: BookingStaffItem) => {
    if (!tenant || !staff.available) return;

    setSendingId(staff.id);

    try {
      const response = await fetch("/api/booking/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          staffId: staff.id,
          staffName: staff.name,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        hint?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      toast.success("Request sent", {
        description: `Booking request for ${staff.name}`,
        position: isMobile ? "top-center" : "top-right",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send request";

      toast.error("Could not send request", {
        description: message,
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
