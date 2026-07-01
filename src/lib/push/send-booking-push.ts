import webpush from "web-push";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

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
  staffName: string,
) {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0, skipped: true as const };
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("tenant_slug", tenantSlug);

  if (error || !subscriptions?.length) {
    return { sent: 0, failed: 0, skipped: false as const };
  }

  configureWebPush();

  const payload = JSON.stringify({
    title: "New booking request",
    body: `${staffName} — customer tapped Book`,
    url: "/admin",
  });

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
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
