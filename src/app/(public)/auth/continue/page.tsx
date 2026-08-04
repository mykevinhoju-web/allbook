"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AllBookLogo } from "@/features/platform-landing/components/allbook-logo";

/**
 * After OAuth / magic link: bridge Supabase session → admin cookie → tenant admin.
 */
export default function AuthContinuePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const response = await fetch("/api/platform/auth/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as {
        error?: string;
        redirectTo?: string;
        needsProfile?: boolean;
        email?: string;
        fullName?: string;
        phone?: string;
      };

      if (cancelled) return;

      if (response.status === 428 || data.needsProfile) {
        const params = new URLSearchParams();
        if (data.email) params.set("email", data.email);
        if (data.fullName) params.set("name", data.fullName);
        if (data.phone) params.set("phone", data.phone);
        router.replace(`/signup/complete?${params.toString()}`);
        return;
      }

      if (!response.ok || !data.redirectTo) {
        setError(data.error ?? "Could not open your admin.");
        return;
      }

      window.location.href = data.redirectTo;
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-[#F4F0EA] px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="inline-flex">
          <AllBookLogo layout="horizontal" size="md" variant="ink" />
        </Link>
        {error ? (
          <>
            <p className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex text-sm font-semibold text-neutral-950 underline"
            >
              Back to login
            </Link>
          </>
        ) : (
          <p className="mt-8 text-sm text-neutral-600">Opening your admin…</p>
        )}
      </div>
    </div>
  );
}
