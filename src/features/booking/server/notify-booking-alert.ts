import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createServiceSupabase } from "@/lib/admin/tenant-context";
import { sendBookingPushNotifications } from "@/lib/push/send-booking-push";
import type { Database } from "@/types/database";

import type { BookingAlertPayload } from "../types/booking-alert";

function getChannelName(tenantSlug: string) {
  return `tenant:${tenantSlug}:booking-alerts`;
}

/** Realtime broadcast so open admin tabs get the toast even if postgres_changes is delayed. */
async function broadcastBookingAlert(
  tenantSlug: string,
  payload: BookingAlertPayload,
): Promise<void> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const channel = supabase.channel(getChannelName(tenantSlug), {
    config: { broadcast: { ack: false } },
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      void supabase.removeChannel(channel);
      reject(new Error("Realtime broadcast timed out"));
    }, 10_000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void channel
          .send({
            type: "broadcast",
            event: "new_booking",
            payload,
          })
          .then(() => {
            clearTimeout(timeout);
            void supabase.removeChannel(channel);
            resolve();
          })
          .catch((error: Error) => {
            clearTimeout(timeout);
            void supabase.removeChannel(channel);
            reject(error);
          });
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timeout);
        void supabase.removeChannel(channel);
        reject(new Error(`Realtime ${status}`));
      }
    });
  });
}

export type NotifyBookingAlertArgs = {
  tenantSlug: string;
  staffId: string;
  staffName: string;
  roomName?: string | null;
  startsAt?: string;
  endsAt?: string;
};

/**
 * Inserts a booking_alert_events row (postgres_changes), broadcasts,
 * and sends web push. Safe to fire-and-forget via `after()`.
 */
export async function notifyBookingAlert(
  args: NotifyBookingAlertArgs,
): Promise<{ ok: true; method: "database" | "broadcast" }> {
  const supabase = createServiceSupabase();
  const requestedAt = new Date().toISOString();
  const payload: BookingAlertPayload = {
    staffId: args.staffId,
    staffName: args.staffName,
    requestedAt,
  };

  const { error: insertError } = await supabase
    .from("booking_alert_events")
    .insert({
      tenant_slug: args.tenantSlug,
      staff_id: args.staffId,
      staff_name: args.staffName,
    });

  // Always try broadcast so foreground admin tabs update immediately.
  try {
    await broadcastBookingAlert(args.tenantSlug, payload);
  } catch {
    // postgres_changes may still deliver if insert succeeded.
  }

  await sendBookingPushNotifications(args.tenantSlug, {
    staffId: args.staffId,
    staffName: args.staffName,
    roomName: args.roomName ?? null,
    startsAt: args.startsAt ?? requestedAt,
    endsAt: args.endsAt ?? requestedAt,
  });

  if (!insertError) {
    return { ok: true, method: "database" };
  }

  return { ok: true, method: "broadcast" };
}

/** Schedule notify without blocking the booking API response. */
export function scheduleBookingAlert(args: NotifyBookingAlertArgs) {
  after(() => {
    void notifyBookingAlert(args);
  });
}
