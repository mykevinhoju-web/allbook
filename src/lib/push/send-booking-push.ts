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

const PUSH_CONCURRENCY = 20;

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0;

  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      await worker(items[current]!);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => run(),
  );
  await Promise.all(runners);
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

  // Only load recipients that should receive this booking alert.
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, audience, staff_id")
    .eq("tenant_slug", tenantSlug)
    .or(
      `audience.is.null,audience.eq.admin,and(audience.eq.staff,staff_id.eq.${booking.staffId})`,
    );

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
  const staleIds: string[] = [];

  await mapPool(subscriptions, PUSH_CONCURRENCY, async (subscription) => {
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
        staleIds.push(subscription.id);
      }
    }
  });

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  return { sent, failed, skipped: false as const };
}

export async function sendRoomVacatedPushNotifications(
  tenantSlug: string,
  event: {
    staffName: string;
    roomName: string | null;
  },
) {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0, skipped: true as const };
  }

  const supabase = createServiceSupabase();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("tenant_slug", tenantSlug)
    .or("audience.is.null,audience.eq.admin");

  if (error || !subscriptions?.length) {
    return { sent: 0, failed: 0, skipped: false as const };
  }

  configureWebPush();

  const roomPart = event.roomName ?? "Room";
  const payload = JSON.stringify({
    title: "Room vacated",
    body: `${roomPart} · ${event.staffName} checked out`,
    url: "/admin/rooms/schedule",
  });

  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];

  await mapPool(subscriptions, PUSH_CONCURRENCY, async (subscription) => {
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
        staleIds.push(subscription.id);
      }
    }
  });

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  return { sent, failed, skipped: false as const };
}
