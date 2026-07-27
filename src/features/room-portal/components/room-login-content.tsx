"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { cn } from "@/lib/utils";

interface RoomOption {
  id: string;
  name: string;
  available: boolean;
  claimedByThis: boolean;
}

const DEVICE_STORAGE_KEY = "allbook_room_device_id";

function getStoredDeviceId(): string | null {
  try {
    return localStorage.getItem(DEVICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeDeviceId(deviceId: string) {
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
  } catch {
    // ignore
  }
}

export function RoomLoginContent() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // If this tablet already has a room, skip the picker and go to PIN.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/room/me");
        const data = (await response.json()) as { user?: { roomName?: string } };
        if (!cancelled && response.ok && data.user) {
          router.replace("/room");
          return;
        }
      } catch {
        // fall through to room picker
      }
      if (!cancelled) setCheckingSession(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/room/auth/rooms");
      const data = (await response.json()) as {
        rooms?: RoomOption[];
        error?: string;
      };
      if (!response.ok) {
        toast.error("Could not load rooms", { description: data.error });
        return;
      }
      setRooms(data.rooms ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (checkingSession) return;
    void loadRooms();
  }, [checkingSession, loadRooms]);

  const claimRoom = async (roomId: string, force = false) => {
    setClaimingId(roomId);
    try {
      const response = await fetch("/api/room/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          force,
          deviceId: getStoredDeviceId() ?? undefined,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        code?: string;
        deviceId?: string;
        room?: { name: string };
      };

      if (response.status === 409 && data.code === "ROOM_CLAIMED") {
        const takeOver = window.confirm(
          `${data.error}\n\nTake over this room on this tablet? The other tablet will need to select a room again.`,
        );
        if (takeOver) {
          await claimRoom(roomId, true);
        }
        return;
      }

      if (!response.ok) {
        toast.error("Could not sign in room", { description: data.error });
        return;
      }

      if (data.deviceId) storeDeviceId(data.deviceId);
      toast.success(`${data.room?.name ?? "Room"} ready`);
      router.replace("/room");
      router.refresh();
    } finally {
      setClaimingId(null);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-base text-muted-foreground">
        Loading...</div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl touch-manipulation flex-col justify-center px-4 py-8 select-none sm:px-6 md:px-8">
      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-10">
        <div className="flex items-start gap-4 md:items-center">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted md:size-16">
            <DoorOpen className="size-7 text-foreground md:size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Select room
            </h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              First-time setup or when moving this tablet to another room.
              Each room can only be used on one tablet.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
          {loading ? (
            <p className="col-span-full text-base text-muted-foreground">
              Loading rooms...</p>
          ) : rooms.length === 0 ? (
            <p className="col-span-full text-base text-muted-foreground">
              No active rooms. Ask an admin to add Room 1-6 in Admin - Rooms.
            </p>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                disabled={claimingId !== null}
                onClick={() => void claimRoom(room.id)}
                className={cn(
                  "min-h-[5.5rem] rounded-2xl border px-4 py-5 text-left transition active:scale-[0.99] md:min-h-[7rem] md:px-5 md:py-6",
                  room.claimedByThis
                    ? "border-primary bg-primary/10"
                    : room.available
                      ? "border-border bg-card hover:border-border hover:bg-background"
                      : "border-amber-200 bg-amber-50",
                )}
              >
                <p className="text-xl font-semibold text-foreground md:text-2xl">
                  {room.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">
                  {room.claimedByThis
                    ? "This tablet"
                    : room.available
                      ? "Available"
                      : "In use on another tablet"}
                </p>
              </button>
            ))
          )}
        </div>

        <AppButton
          type="button"
          variant="outline"
          className="mt-8 h-14 w-full rounded-2xl text-base md:h-16 md:text-lg"
          onClick={() => void loadRooms()}
        >
          Refresh
        </AppButton>
      </div>
    </div>
  );
}
