"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DoorOpen, Loader2 } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AdminBooking } from "@/features/booking/types/admin-booking";

interface AvailableRoom {
  id: string;
  name: string;
  sortOrder: number;
  priority: number;
  available: boolean;
  conflictLabel?: string;
  isAssigned: boolean;
}

interface StaffCheckInSheetProps {
  booking: AdminBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckedIn?: () => void;
}

export function StaffCheckInSheet({
  booking,
  open,
  onOpenChange,
  onCheckedIn,
}: StaffCheckInSheetProps) {
  const [pin, setPin] = useState("");
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open || !booking) {
      setPin("");
      setRooms([]);
      setSelectedRoomId("");
      return;
    }

    let cancelled = false;
    setLoadingRooms(true);

    void (async () => {
      const response = await fetch(
        `/api/staff/rooms/available?bookingId=${booking.id}`,
      );
      const data = (await response.json()) as {
        rooms?: AvailableRoom[];
        error?: string;
      };

      if (cancelled) return;

      if (!response.ok) {
        toast.error("Could not load rooms", { description: data.error });
        setLoadingRooms(false);
        return;
      }

      const list = data.rooms ?? [];
      setRooms(list);
      const defaultRoom =
        list.find((room) => room.isAssigned && room.available)?.id ??
        list.find((room) => room.available)?.id ??
        "";
      setSelectedRoomId(defaultRoom);
      setLoadingRooms(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, booking]);

  const pinDigits = useMemo(() => pin.padEnd(4, " ").split("").slice(0, 4), [pin]);

  const setPinDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const chars = pin.padEnd(4, " ").split("");
    chars[index] = digit || " ";
    const next = chars.join("").trimEnd();
    setPin(next.replace(/\s/g, ""));

    if (digit && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const submit = async () => {
    if (!booking || pin.length !== 4 || !selectedRoomId) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/staff/bookings/${booking.id}/check-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin, roomId: selectedRoomId }),
        },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error("Could not check in", { description: data.error });
        return;
      }

      toast.success("Checked in", {
        description: rooms.find((room) => room.id === selectedRoomId)?.name,
      });
      onOpenChange(false);
      onCheckedIn?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-[1.25rem] px-4 pb-8 pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <SheetHeader className="px-1 pb-4 text-left">
          <SheetTitle className="text-xl font-semibold">Enter room</SheetTitle>
          {booking ? (
            <p className="text-sm text-muted-foreground">
              {booking.customerName ?? "Walk-in"}
              {booking.roomName ? ` · assigned ${booking.roomName}` : ""}
            </p>
          ) : null}
        </SheetHeader>

        <div className="space-y-5">
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your 4-digit PIN
            </p>
            <div className="flex justify-center gap-2">
              {pinDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    pinRefs.current[index] = node;
                  }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit.trim()}
                  onChange={(event) => setPinDigit(index, event.target.value)}
                  className="size-12 rounded-xl border border-border/60 bg-background text-center text-lg font-semibold tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  autoComplete="off"
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Choose room
            </p>
            {loadingRooms ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading rooms…
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {rooms.map((room) => {
                  const selected = selectedRoomId === room.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      disabled={!room.available}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-left transition",
                        !room.available &&
                          "cursor-not-allowed border-border/40 bg-muted/40 opacity-60",
                        room.available &&
                          !selected &&
                          "border-border/60 bg-card hover:border-primary/40",
                        selected &&
                          "border-primary bg-primary/10 ring-2 ring-primary/30",
                      )}
                    >
                      <p className="text-sm font-semibold">{room.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {room.available
                          ? room.isAssigned
                            ? "Assigned"
                            : "Available"
                          : (room.conflictLabel ?? "In use")}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <AppButton
            type="button"
            className="h-12 w-full rounded-2xl text-base"
            disabled={
              submitting || pin.length !== 4 || !selectedRoomId || loadingRooms
            }
            onClick={() => void submit()}
          >
            <DoorOpen className="size-4" />
            {submitting ? "Checking in…" : "Confirm check-in"}
          </AppButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
