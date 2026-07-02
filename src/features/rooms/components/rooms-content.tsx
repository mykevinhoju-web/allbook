"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen, Plus, Trash2 } from "lucide-react";

import { AppButton, ConfirmDialog, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
        <p className="text-sm text-muted-foreground">
          Manage treatment rooms for this tenant. Bookings auto-pick the first
          available room for the selected time slot.
        </p>
        <p className="text-sm">
          <Link href="/admin/rooms/schedule" className="text-primary underline">
            View room schedule
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newRoomName}
          onChange={(event) => setNewRoomName(event.target.value)}
          placeholder="Room name"
          className="rounded-xl"
        />
        <AppButton
          type="button"
          className="rounded-xl"
          onClick={() => void addRoom()}
        >
          <Plus className="size-4" />
          Add room
        </AppButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
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
                  {room.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
