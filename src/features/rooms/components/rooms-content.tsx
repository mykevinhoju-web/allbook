"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, DoorOpen, Plus, Trash2 } from "lucide-react";

import { AppButton, ConfirmDialog, toast } from "@/components/common";
import { appButtonVariants } from "@/components/common/app-button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { cn } from "@/lib/utils";
import type { AdminRoom } from "@/features/booking/types/admin-booking";

export function RoomsContent() {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    const response = await fetch("/api/admin/rooms");
    const data = (await response.json()) as { rooms?: AdminRoom[]; error?: string };

    if (!response.ok) {
      toast.error("Could not load rooms", { description: data.error });
      return;
    }

    setRooms(data.rooms ?? []);
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const addRoom = async () => {
    if (!newRoomName.trim()) return;

    const response = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoomName.trim() }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      toast.error("Could not add room", { description: data.error });
      return;
    }

    setNewRoomName("");
    void loadRooms();
  };

  const toggleRoom = async (room: AdminRoom) => {
    const response = await fetch(`/api/admin/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !room.isActive }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      toast.error("Could not update room", { description: data.error });
      return;
    }

    void loadRooms();
  };

  const deleteRoom = async () => {
    if (!deleteId) return;

    const response = await fetch(`/api/admin/rooms/${deleteId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      toast.error("Could not delete room", { description: data.error });
      return;
    }

    setDeleteId(null);
    void loadRooms();
  };

  const moveRoom = async (room: AdminRoom, direction: "up" | "down") => {
    const index = rooms.findIndex((item) => item.id === room.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const swapRoom = rooms[swapIndex];
    if (!swapRoom) return;

    const response = await Promise.all([
      fetch(`/api/admin/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swapRoom.sortOrder }),
      }),
      fetch(`/api/admin/rooms/${swapRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: room.sortOrder }),
      }),
    ]);

    if (response.some((item) => !item.ok)) {
      toast.error("Could not reorder rooms");
      return;
    }

    void loadRooms();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:gap-6 lg:p-6">
      <AdminPageHeader
        title="Rooms"
        description="Booking priority follows the order below (e.g. Room 2 → 3 → 4 → 1 → 6). The first free room in this list is auto-assigned."
        action={
          <Link
            href="/admin/rooms/schedule"
            className={cn(
              appButtonVariants({ variant: "outline" }),
              "h-11 w-full rounded-xl sm:w-auto",
            )}
          >
            View schedule
          </Link>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newRoomName}
          onChange={(event) => setNewRoomName(event.target.value)}
          placeholder="Room name"
          className="h-11 rounded-xl"
        />
        <AppButton
          type="button"
          className="h-11 rounded-xl"
          onClick={() => void addRoom()}
        >
          <Plus className="size-4" />
          Add room
        </AppButton>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rooms.map((room, index) => (
          <div
            key={room.id}
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DoorOpen className="size-5" />
              </div>
              <div>
                <p className="font-medium">{room.name}</p>
                <p className="text-xs text-muted-foreground">
                  Priority {index + 1}
                  {room.isActive ? "" : " · Inactive"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-lg"
                disabled={index === 0}
                aria-label={`Move ${room.name} up`}
                onClick={() => void moveRoom(room, "up")}
              >
                <ArrowUp className="size-4" />
              </AppButton>
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-lg"
                disabled={index === rooms.length - 1}
                aria-label={`Move ${room.name} down`}
                onClick={() => void moveRoom(room, "down")}
              >
                <ArrowDown className="size-4" />
              </AppButton>
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => void toggleRoom(room)}
              >
                {room.isActive ? "Disable" : "Enable"}
              </AppButton>
              <AppButton
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${room.name}`}
                onClick={() => setDeleteId(room.id)}
              >
                <Trash2 className="size-4" />
              </AppButton>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete room?"
        description="Future bookings will need another available room."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void deleteRoom()}
      />
    </div>
  );
}
