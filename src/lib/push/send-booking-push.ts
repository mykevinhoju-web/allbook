import webpush from "web-push";

import { createServiceSupabase } from "@/lib/admin/tenant-context";

import { getVapidSubject, isPushConfigured } from "./vapid";

function configureWebPush() {
  webpush.setVapidDetails(
    getVapidSubject(),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export async function sendBookingPushNotifications(
  tenantSlug: string,
  booking: {
    staffId: string;
    staffName: string;
    roomName: string | null;
    startsAt: string;
    endsAt: string;
  },
) {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0, skipped: true as const };
  }

  const supabase = createServiceSupabase();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, audience, staff_id")
    .eq("tenant_slug", tenantSlug);

  if (error || !subscriptions?.length) {
    return { sent: 0, failed: 0, skipped: false as const };
  }

  configureWebPush();

  const roomPart = booking.roomName ? ` · ${booking.roomName}` : "";
  const when = `${new Date(booking.startsAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}–${new Date(booking.endsAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const payload = JSON.stringify({
    title: "New booking",
    body: `${booking.staffName} · ${when}${roomPart}`,
    url: "/admin/bookings",
  });

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const audience = (subscription as { audience?: string }).audience;
    const staffId = (subscription as { staff_id?: string | null }).staff_id ?? null;
    const isAdmin = !audience || audience === "admin";
    const isStaff = audience === "staff" && staffId === booking.staffId;
    if (!isAdmin && !isStaff) continue;
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
      );
      sent += 1;
    } catch (pushError) {
      failed += 1;
      const statusCode =
        pushError instanceof webpush.WebPushError
          ? pushError.statusCode
          : undefined;

      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id);
      }
    }
  }

  return { sent, failed, skipped: false as const };
}
