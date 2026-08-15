"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen, UserRound } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { cn } from "@/lib/utils";

import { clearRoomClientSession } from "../lib/room-session-gate";

interface RoomOption {
  id: string;
  name: string;
  available: boolean;
  claimedByThis: boolean;
}

export function RoomLoginContent() {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/room/auth/rooms", {
        credentials: "include",
      });
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
    let cancelled = false;
    void (async () => {
      clearRoomClientSession();
      await fetch("/api/room/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!cancelled) await loadRooms();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRooms]);

  const claimRoom = async (roomId: string, force = false) => {
    setClaimingId(roomId);
    try {
      const response = await fetch("/api/room/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          force,
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

      toast.success(`${data.room?.name ?? "Room"} ready — enter staff PIN`);
      window.location.replace("/room");
    } finally {
      setClaimingId(null);
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-base text-muted-foreground">
        Loading...
      </div>
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

        <div className="mt-8 border-t border-border/60 pt-6">
          <Link
            href="/staff/login"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 text-base font-semibold text-foreground transition hover:bg-muted md:h-16 md:text-lg"
          >
            <UserRound className="size-5" />
            Staff login
          </Link>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            View your schedule and reports with your staff code.
          </p>
        </div>
      </div>
    </div>
  );
}
