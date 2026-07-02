"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";

export default function StaffLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/staff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error("Could not sign in", { description: data.error });
        return;
      }

      toast.success("Signed in");
      router.push("/admin/bookings");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to receive booking alerts for your own schedule.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm">
            <span>Login ID</span>
            <Input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              className="rounded-xl"
              autoComplete="username"
            />
          </label>

          <label className="block space-y-2 text-sm">
            <span>Password</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl"
              autoComplete="current-password"
            />
          </label>

          <AppButton
            type="button"
            className="h-11 w-full rounded-xl text-base"
            disabled={loading}
            onClick={() => void submit()}
          >
            {loading ? "Signing in..." : "Sign in"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}

