"use client";

import { useEffect, useState } from "react";

/** Re-render every minute so past bookings drop off room views. */
export function useNowTick(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
