import { NextResponse } from "next/server";

import type { BookingAlertPayload } from "@/features/booking/types/booking-alert";
import { createServiceSupabase } from "@/lib/admin/tenant-context";
import { sendBookingPushNotifications } from "@/lib/push/send-booking-push";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

function getChannelName(tenantSlug: string) {
  return `tenant:${tenantSlug}:booking-alerts`;
}

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

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      void supabase.removeChannel(channel);
      reject(new Error("Realtime broadcast timed out"));
    }, 10000);

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

export async function POST(request: Request) {
  let body: {
    tenantSlug?: string;
    staffId?: string;
    staffName?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenantSlug, staffId, staffName } = body;

  if (!tenantSlug || !staffId || !staffName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const payload: BookingAlertPayload = {
    staffId,
    staffName,
    requestedAt: new Date().toISOString(),
  };

  const supabase = createServiceSupabase();

  const { error: insertError } = await supabase
    .from("booking_alert_events")
    .insert({
      tenant_slug: tenantSlug,
      staff_id: staffId,
      staff_name: staffName,
    });

  const pushResult = await sendBookingPushNotifications(tenantSlug, {
    staffId,
    staffName,
    roomName: null,
    startsAt: payload.requestedAt,
    endsAt: payload.requestedAt,
  });

  if (!insertError) {
    return NextResponse.json({
      ok: true,
      method: "database",
      push: pushResult,
    });
  }

  try {
    await broadcastBookingAlert(tenantSlug, payload);
    return NextResponse.json({
      ok: true,
      method: "broadcast",
      push: pushResult,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send alert";

    return NextResponse.json(
      {
        error: message,
        hint: "Enable Supabase Realtime or run booking_alert_events migration.",
        dbError: insertError.message,
      },
      { status: 503 },
    );
  }
}
