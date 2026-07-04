"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { BookingStaffItem } from "../config/booking-staff-mock";

export function useBookStaff() {
  const router = useRouter();

  const bookStaff = useCallback(
    (staff: BookingStaffItem) => {
      if (!staff.available) return;
      router.push(`/booking/${staff.id}`);
    },
    [router],
  );

  return { bookStaff };
}
