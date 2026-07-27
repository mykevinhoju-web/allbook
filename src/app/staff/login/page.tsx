"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { broadcastStaffPresence } from "@/features/staff/lib/staff-presence-realtime";
import { useTenant } from "@/features/tenants";

export default function StaffLoginPage() {
  const router = useRouter();
  const tenant = useTenant();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomReady, setRoomReady] = useState<boolean | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/room/me");
      const data = (await response.json()) as {
        user?: { roomName?: string } | null;
      };
      if (cancelled) return;
      if (response.ok && data.user?.roomName) {
        setRoomReady(true);
        setRoomName(data.user.roomName);
      } else {
        setRoomReady(false);
        setRoomName(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (nextPin = pin) => {
    if (nextPin.length !== 4 || loading) return;

    if (roomReady === false) {
      toast.error("Room login required first", {
        description:
          "Select this tablet’s room before entering a staff PIN.",
      });
      return;
    }

    setLoading(true);
    try {
      // Prefer room-bound login when a room session exists.
      const response = await fetch(
        roomReady ? "/api/room/staff/login" : "/api/staff/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: nextPin }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
        code?: string;
        staff?: { id: string; name: string };
      };
      if (!response.ok) {
        if (data.code === "ROOM_LOGIN_REQUIRED") {
          toast.error("Room login required first", {
            description: data.error,
          });
          setRoomReady(false);
          return;
        }
        toast.error("Could not sign in", { description: data.error });
        return;
      }

      if (data.staff) {
        void broadcastStaffPresence(tenant.slug, {
          type: "online",
          staffId: data.staff.id,
          staffName: data.staff.name,
          roomName: roomName,
        }).catch(() => {});
      }

      toast.success("Signed in");
      router.push(roomReady ? "/room" : "/staff");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md items-center bg-background p-6">
      <div className="w-full rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your 4-digit PIN from your manager. Room tablets should use{" "}
          <Link href="/room" className="font-medium text-foreground underline">
            /room
          </Link>
          .
        </p>

        {roomReady === false ? (
          <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Room login required first</p>
              <p className="mt-1 text-amber-900/80">
                This tablet has no room selected. Choose Room 1–6 before staff
                PIN sign-in so entry/exit can be tracked for assignments.
              </p>
              <Link
                href="/room/login"
                className="mt-2 inline-flex font-semibold underline"
              >
                Select room now
              </Link>
            </div>
          </div>
        ) : null}

        {roomReady && roomName ? (
          <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            Room signed in: <span className="font-semibold text-foreground">{roomName}</span>
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm">
            <span>4-digit PIN</span>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              autoFocus
              disabled={roomReady !== true}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(next);
                if (next.length === 4 && roomReady === true) {
                  void submit(next);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && pin.length === 4 && roomReady === true) {
                  void submit();
                }
              }}
              className="h-12 rounded-xl text-center text-lg tracking-[0.45em]"
              autoComplete="one-time-code"
            />
          </label>

          <AppButton
            type="button"
            className="h-11 w-full rounded-xl text-base"
            disabled={loading || pin.length !== 4 || roomReady !== true}
            onClick={() => void submit()}
          >
            {loading ? "Signing in..." : "Sign in"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
