import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

import type { BookingAlertPayload } from "../types/booking-alert";

function getChannelName(tenantSlug: string) {
  return `tenant:${tenantSlug}:booking-alerts`;
}

function parseBroadcastPayload(message: unknown): BookingAlertPayload | null {
  if (!message || typeof message !== "object") return null;

  const record = message as Record<string, unknown>;
  const inner =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : record;

  if (
    typeof inner.staffId === "string" &&
    typeof inner.staffName === "string" &&
    typeof inner.requestedAt === "string"
  ) {
    return {
      staffId: inner.staffId,
      staffName: inner.staffName,
      requestedAt: inner.requestedAt,
    };
  }

  return null;
}

export function subscribeToBookingAlerts(
  tenantSlug: string,
  onBooking: (payload: BookingAlertPayload) => void,
  onStatus?: (status: string) => void,
) {
  const supabase = createClient();
  const channel: RealtimeChannel = supabase.channel(getChannelName(tenantSlug), {
    config: { broadcast: { self: true } },
  });

  channel
    .on("broadcast", { event: "new_booking" }, (message) => {
      const payload = parseBroadcastPayload(message);
      if (payload) onBooking(payload);
    })
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "booking_alert_events",
        filter: `tenant_slug=eq.${tenantSlug}`,
      },
      (payload) => {
        const row = payload.new as {
          staff_id: string;
          staff_name: string;
          created_at: string;
        };

        onBooking({
          staffId: row.staff_id,
          staffName: row.staff_name,
          requestedAt: row.created_at,
        });
      },
    )
    .subscribe((status) => {
      onStatus?.(status);
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
