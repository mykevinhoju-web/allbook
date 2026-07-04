"use client";

import { useEffect, useState } from "react";

import type { BookingStaffItem } from "../config/booking-staff-mock";

export function useBookingStaffList() {
  const [staff, setStaff] = useState<BookingStaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/booking/staff");
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Could not load staff");
        }

        const data = (await response.json()) as {
          staff?: BookingStaffItem[];
        };

        if (!cancelled) {
          setStaff(data.staff ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load staff",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { staff, loading, error };
}
