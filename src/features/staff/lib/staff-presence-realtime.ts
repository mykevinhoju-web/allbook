import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export type StaffPresenceEventType = "online" | "offline";

export interface StaffPresencePayload {
  type: StaffPresenceEventType;
  staffId: string;
  staffName: string;
  roomName?: string | null;
  at: string;
}

function getChannelName(tenantSlug: string) {
  return `tenant:${tenantSlug}:staff-presence`;
}

function parsePresencePayload(message: unknown): StaffPresencePayload | null {
  if (!message || typeof message !== "object") return null;

  const record = message as Record<string, unknown>;
  const inner =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : record;

  if (
    (inner.type === "online" || inner.type === "offline") &&
    typeof inner.staffId === "string" &&
    typeof inner.staffName === "string" &&
    typeof inner.at === "string"
  ) {
    return {
      type: inner.type,
      staffId: inner.staffId,
      staffName: inner.staffName,
      roomName:
        typeof inner.roomName === "string" && inner.roomName.trim()
          ? inner.roomName
          : null,
      at: inner.at,
    };
  }

  return null;
}

export function subscribeToStaffPresence(
  tenantSlug: string,
  onPresence: (payload: StaffPresencePayload) => void,
  onStatus?: (status: string) => void,
) {
  const supabase = createClient();
  const channel: RealtimeChannel = supabase.channel(getChannelName(tenantSlug), {
    config: { broadcast: { self: true } },
  });

  channel
    .on("broadcast", { event: "staff_presence" }, (message) => {
      const payload = parsePresencePayload(message);
      if (payload) onPresence(payload);
    })
    .subscribe((status) => {
      onStatus?.(status);
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Fire from room/staff PIN login or logout so admin staff list updates live. */
export async function broadcastStaffPresence(
  tenantSlug: string,
  payload: Omit<StaffPresencePayload, "at"> & { at?: string },
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
    event: "staff_presence",
    payload: {
      ...payload,
      at: payload.at ?? new Date().toISOString(),
    },
  });

  void supabase.removeChannel(channel);
}

export function useStaffPresenceRealtime(
  tenantSlug: string | null | undefined,
  onPresence: (payload: StaffPresencePayload) => void,
) {
  useEffect(() => {
    if (!tenantSlug) return;
    return subscribeToStaffPresence(tenantSlug, onPresence);
  }, [tenantSlug, onPresence]);
}
