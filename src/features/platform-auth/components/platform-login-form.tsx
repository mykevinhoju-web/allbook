"use client";

import Link from "next/link";
import { useState } from "react";

import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";
import { Input } from "@/components/ui/input";

export function PlatformLoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const startOAuth = async (provider: "google" | "facebook") => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, next: "/auth/continue" }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Social login is unavailable right now.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not send login link.");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Link href="/" className="inline-flex">
        <AllBookLogo layout="horizontal" size="md" variant="ink" />
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-neutral-950">
        Log in
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Use Google, Facebook, or a one-tap email link — no password to remember.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void startOAuth("google")}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 transition hover:border-neutral-300"
        >
          Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void startOAuth("facebook")}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 transition hover:border-neutral-300"
        >
          Facebook
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        or email link
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      {sent ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Check <strong>{email}</strong> for your sign-in link.
        </p>
      ) : (
        <div className="space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-neutral-800">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="email"
              placeholder="you@business.com.au"
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
            {loading ? "Sending..." : "Email me a login link"}
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-neutral-600">
        New here?{" "}
        <Link
          href="/signup"
          className="font-semibold text-neutral-950 underline"
        >
          Start free trial
        </Link>
      </p>
    </div>
  );
}
