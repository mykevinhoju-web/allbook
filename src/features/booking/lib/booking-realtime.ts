import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

import type { BookingAlertPayload } from "../types/booking-alert";
import type {
  ExtendRequestAlertPayload,
  ExtendRequestResolvedPayload,
} from "../types/extend-request";
import type { ServiceEndAlertPayload } from "../types/service-end-alert";

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

function parseServiceEndPayload(message: unknown): ServiceEndAlertPayload | null {
  if (!message || typeof message !== "object") return null;
  const record = message as Record<string, unknown>;
  const inner =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : record;

  if (
    typeof inner.bookingId === "string" &&
    typeof inner.staffName === "string" &&
    typeof inner.roomName === "string" &&
    typeof inner.endedAt === "string"
  ) {
    return {
      bookingId: inner.bookingId,
      staffId: typeof inner.staffId === "string" ? inner.staffId : "",
      staffName: inner.staffName,
      roomName: inner.roomName,
      endedAt: inner.endedAt,
    };
  }
  return null;
}

function parseExtendRequestPayload(
  message: unknown,
): ExtendRequestAlertPayload | null {
  if (!message || typeof message !== "object") return null;
  const record = message as Record<string, unknown>;
  const inner =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : record;

  if (
    typeof inner.requestId === "string" &&
    typeof inner.bookingId === "string" &&
    typeof inner.minutes === "number" &&
    typeof inner.staffName === "string" &&
    typeof inner.roomName === "string" &&
    typeof inner.requestedAt === "string"
  ) {
    return {
      requestId: inner.requestId,
      bookingId: inner.bookingId,
      minutes: inner.minutes,
      staffName: inner.staffName,
      roomName: inner.roomName,
      customerName:
        typeof inner.customerName === "string" ? inner.customerName : null,
      requestedAt: inner.requestedAt,
    };
  }
  return null;
}

function parseExtendResolvedPayload(
  message: unknown,
): ExtendRequestResolvedPayload | null {
  if (!message || typeof message !== "object") return null;
  const record = message as Record<string, unknown>;
  const inner =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : record;

  if (
    typeof inner.requestId === "string" &&
    typeof inner.bookingId === "string" &&
    (inner.status === "approved" ||
      inner.status === "rejected" ||
      inner.status === "cancelled") &&
    typeof inner.minutes === "number" &&
    typeof inner.resolvedAt === "string"
  ) {
    return {
      requestId: inner.requestId,
      bookingId: inner.bookingId,
      status: inner.status,
      minutes: inner.minutes,
      newEndsAt:
        typeof inner.newEndsAt === "string" ? inner.newEndsAt : undefined,
      resolvedAt: inner.resolvedAt,
    };
  }
  return null;
}

export function subscribeToBookingAlerts(
  tenantSlug: string,
  onBooking: (payload: BookingAlertPayload) => void,
  onStatus?: (status: string) => void,
  onServiceEnd?: (payload: ServiceEndAlertPayload) => void,
  onExtendRequest?: (payload: ExtendRequestAlertPayload) => void,
  onExtendResolved?: (payload: ExtendRequestResolvedPayload) => void,
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
    .on("broadcast", { event: "service_end" }, (message) => {
      const payload = parseServiceEndPayload(message);
      if (payload && onServiceEnd) onServiceEnd(payload);
    })
    .on("broadcast", { event: "extend_request" }, (message) => {
      const payload = parseExtendRequestPayload(message);
      if (payload && onExtendRequest) onExtendRequest(payload);
    })
    .on("broadcast", { event: "extend_resolved" }, (message) => {
      const payload = parseExtendResolvedPayload(message);
      if (payload && onExtendResolved) onExtendResolved(payload);
    })
    .subscribe((status) => {
      onStatus?.(status);
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

async function broadcastOnAlertsChannel(
  tenantSlug: string,
  event: string,
  payload: object,
) {
  const supabase = createClient();
  const channel = supabase.channel(getChannelName(tenantSlug), {
    config: { broadcast: { self: true } },
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Broadcast subscribe timed out."));
    }, 4000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        window.clearTimeout(timeout);
        resolve();
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        window.clearTimeout(timeout);
        reject(new Error(`Broadcast failed: ${status}`));
      }
    });
  });

  await channel.send({
    type: "broadcast",
    event,
    payload,
  });

  void supabase.removeChannel(channel);
}

/** Fire from room tablet when service time ends so admin hears the alarm too. */
export async function broadcastServiceEnd(
  tenantSlug: string,
  payload: ServiceEndAlertPayload,
) {
  await broadcastOnAlertsChannel(tenantSlug, "service_end", payload);
}

export async function broadcastExtendRequest(
  tenantSlug: string,
  payload: ExtendRequestAlertPayload,
) {
  await broadcastOnAlertsChannel(tenantSlug, "extend_request", payload);
}

export async function broadcastExtendResolved(
  tenantSlug: string,
  payload: ExtendRequestResolvedPayload,
) {
  await broadcastOnAlertsChannel(tenantSlug, "extend_resolved", payload);
}
