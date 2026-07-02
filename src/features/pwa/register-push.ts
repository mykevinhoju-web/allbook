function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported on this device.");
  }

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function subscribeToWebPush(tenantSlug: string): Promise<void> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    throw new Error("Push notifications are not configured on the server.");
  }

  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported on this browser.");
  }

  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error("Notification permission was denied.");
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const json = subscription.toJSON();

  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Invalid push subscription.");
  }

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantSlug,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      userAgent: navigator.userAgent,
    }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string; hint?: string };
    const message = data.error ?? "Failed to save push subscription.";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl
      ? (() => {
          try {
            const hostname = new URL(supabaseUrl).hostname;
            const first = hostname.split(".")[0];
            return first && first !== "localhost" ? first : null;
          } catch {
            return null;
          }
        })()
      : null;
    const isMissingTable =
      message.includes("push_subscriptions") &&
      message.includes("does not exist") &&
      !message.includes("column");

    throw new Error(
      isMissingTable
        ? `Push database table is missing. Run setup.sql section 4 in Supabase, then try again.${
            projectRef ? ` (Supabase project ref: ${projectRef})` : ""
          }`
        : `${message}${projectRef ? ` (Supabase project ref: ${projectRef})` : ""}`,
    );
  }
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
