import { createClient } from "@/lib/supabase/client";

import type { BookingAlertPayload } from "../types/booking-alert";

function getChannelName(tenantSlug: string) {
  return `tenant:${tenantSlug}:booking-alerts`;
}

export function subscribeToBookingAlerts(
  tenantSlug: string,
  onBooking: (payload: BookingAlertPayload) => void,
) {
  const supabase = createClient();
  const channel = supabase.channel(getChannelName(tenantSlug), {
    config: { broadcast: { self: false } },
  });

  channel.on("broadcast", { event: "new_booking" }, ({ payload }) => {
    onBooking(payload as BookingAlertPayload);
  });

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function broadcastNewBooking(
  tenantSlug: string,
  payload: BookingAlertPayload,
): Promise<void> {
  const supabase = createClient();
  const channel = supabase.channel(getChannelName(tenantSlug), {
    config: { broadcast: { ack: true, self: false } },
  });

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      void supabase.removeChannel(channel);
      reject(new Error("Realtime connection timed out"));
    }, 8000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void channel
          .send({
            type: "broadcast",
            event: "new_booking",
            payload,
          })
          .then(() => {
            window.clearTimeout(timeout);
            void supabase.removeChannel(channel);
            resolve();
          })
          .catch((error: Error) => {
            window.clearTimeout(timeout);
            void supabase.removeChannel(channel);
            reject(error);
          });
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        window.clearTimeout(timeout);
        void supabase.removeChannel(channel);
        reject(new Error(`Realtime ${status}`));
      }
    });
  });
}
