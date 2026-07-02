"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";

import type { Database } from "@/types/database";

export function subscribeToBookingUpdates(
  tenantId: string,
  onChange: () => void,
): () => void {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const channel = supabase
    .channel(`tenant:${tenantId}:bookings`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookings",
        filter: `tenant_id=eq.${tenantId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function useBookingRealtime(
  tenantId: string | undefined,
  onChange: () => void,
) {
  useEffect(() => {
    if (!tenantId) return undefined;

    return subscribeToBookingUpdates(tenantId, onChange);
  }, [tenantId, onChange]);
}
