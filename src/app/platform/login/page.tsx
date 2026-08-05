"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";
import { Input } from "@/components/ui/input";

export default function PlatformAdminLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      const data = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not sign in.");
        return;
      }
      router.push(data.redirectTo ?? "/platform");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-[#F4F0EA] px-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-8">
        <AllBookLogo layout="horizontal" size="md" variant="ink" />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-neutral-950">
          AllBook Admin
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Platform login for signup list and tenant oversight.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-neutral-800">Login ID</span>
            <Input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="username"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-neutral-800">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="current-password"
            />
          </label>
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit()}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
