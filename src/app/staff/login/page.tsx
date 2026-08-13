"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";

export default function StaffLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/staff/auth/me");
        const data = (await response.json()) as {
          user?: { role?: string; staffId?: string } | null;
        };
        if (
          !cancelled &&
          response.ok &&
          data.user?.role === "staff" &&
          data.user.staffId
        ) {
          router.replace("/staff");
          return;
        }
      } catch {
        // fall through to login form
      }
      if (!cancelled) setCheckingSession(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const submit = async (nextPin = pin) => {
    if (nextPin.length !== 4 || loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/staff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: nextPin }),
      });

      const data = (await response.json()) as {
        error?: string;
        staff?: { id: string; name: string };
      };
      if (!response.ok) {
        toast.error("Could not sign in", { description: data.error });
        return;
      }

      toast.success(data.staff?.name ? `Hi, ${data.staff.name}` : "Signed in");
      router.replace("/staff");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-base text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md items-center bg-background p-6">
      <div className="w-full rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <UserRound className="size-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Staff sign in
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your 4-digit staff code to see your schedule and reports.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm">
            <span>Staff code</span>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              autoFocus
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(next);
                if (next.length === 4) void submit(next);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && pin.length === 4) {
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
            disabled={loading || pin.length !== 4}
            onClick={() => void submit()}
          >
            {loading ? "Signing in..." : "Sign in"}
          </AppButton>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Room tablet?{" "}
          <Link href="/room/login" className="font-medium text-foreground underline">
            Select room
          </Link>
        </p>
      </div>
    </div>
  );
}
