"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { BookingStaffItem } from "../config/booking-staff-mock";

export function useBookStaff() {
  const router = useRouter();

  const bookStaff = useCallback(
    (staff: BookingStaffItem, options?: { returnTo?: string; theme?: string }) => {
      if (!staff.available) return;

      const params = new URLSearchParams();
      if (options?.returnTo) params.set("returnTo", options.returnTo);
      if (options?.theme) params.set("theme", options.theme);

      const query = params.toString();
      router.push(`/booking/${staff.id}${query ? `?${query}` : ""}`);
    },
    [router],
  );

  return { bookStaff };
}
