"use client";

import { useEffect, useState } from "react";

import type { BookingStaffItem } from "../config/booking-staff-mock";

export function useBookingStaffList(fallback: BookingStaffItem[]) {
  const [staff, setStaff] = useState<BookingStaffItem[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/booking/staff");
        if (!response.ok) return;

        const data = (await response.json()) as {
          staff?: BookingStaffItem[];
        };

        if (!cancelled && data.staff?.length) {
          setStaff(data.staff);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { staff, loading };
}
