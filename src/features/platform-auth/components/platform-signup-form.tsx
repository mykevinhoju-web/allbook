"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";
import { PLATFORM_BUSINESS_TYPES } from "@/features/platform-auth/config/business-types";
import { Input } from "@/components/ui/input";

type SignupFormState = {
  fullName: string;
  phone: string;
  businessName: string;
  businessType: string;
  email: string;
};

const INITIAL: SignupFormState = {
  fullName: "",
  phone: "",
  businessName: "",
  businessType: "day_spa",
  email: "",
};

export function PlatformSignupForm({
  initial,
  mode = "signup",
}: {
  initial?: Partial<SignupFormState>;
  mode?: "signup" | "complete";
}) {
  const router = useRouter();
  const [form, setForm] = useState<SignupFormState>({ ...INITIAL, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof SignupFormState>(
    key: K,
    value: SignupFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const startOAuth = async (provider: "google" | "facebook") => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          next: mode === "complete" ? "/auth/continue" : "/signup/complete",
        }),
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
      const endpoint =
        mode === "complete"
          ? "/api/platform/auth/continue"
          : "/api/platform/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as {
        error?: string;
        redirectTo?: string;
        needsProfile?: boolean;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not create your account.");
        return;
      }

      if (data.redirectTo) {
        window.location.href = data.redirectTo;
        return;
      }

      router.push("/login");
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
        {mode === "complete" ? "Finish your free trial" : "Start free trial"}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        No password needed — just your details. Each account keeps its own
        bookings and staff.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void startOAuth("google")}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 transition hover:border-neutral-300"
        >
          Continue with Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void startOAuth("facebook")}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 transition hover:border-neutral-300"
        >
          Continue with Facebook
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        or email
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <div className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-neutral-800">Name</span>
          <Input
            value={form.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            className="h-11 rounded-xl"
            autoComplete="name"
            placeholder="Your name"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-neutral-800">Contact</span>
          <Input
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            className="h-11 rounded-xl"
            autoComplete="tel"
            placeholder="Mobile number"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-neutral-800">Business name</span>
          <Input
            value={form.businessName}
            onChange={(e) => setField("businessName", e.target.value)}
            className="h-11 rounded-xl"
            placeholder="Studio or shop name"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-neutral-800">Business type</span>
          <select
            value={form.businessType}
            onChange={(e) => setField("businessType", e.target.value)}
            className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {PLATFORM_BUSINESS_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-neutral-800">Email</span>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            className="h-11 rounded-xl"
            autoComplete="email"
            placeholder="you@business.com.au"
            disabled={mode === "complete"}
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
          {loading
            ? "Creating account..."
            : mode === "complete"
              ? "Create my account"
              : "Create free account"}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-neutral-950 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
