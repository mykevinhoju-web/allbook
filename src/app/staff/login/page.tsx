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
      router.push("/staff");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md items-center p-6">
      <div className="w-full rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the login ID and 4-digit PIN set by your manager. Stay signed in
          until you sign out.
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
            <span>4-digit PIN</span>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={password}
              onChange={(event) =>
                setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="rounded-xl tracking-[0.35em]"
              autoComplete="current-password"
            />
          </label>

          <AppButton
            type="button"
            className="h-11 w-full rounded-xl text-base"
            disabled={loading || password.length !== 4 || !loginId.trim()}
            onClick={() => void submit()}
          >
            {loading ? "Signing in..." : "Sign in"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
