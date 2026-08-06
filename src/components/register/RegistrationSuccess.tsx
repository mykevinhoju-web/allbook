"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CheckCircle2, LayoutDashboard } from "lucide-react";

import type { CreateSalonRegistrationResult } from "@/features/salon-registration";

import {
  registerPrimaryButtonClass,
  registerSecondaryButtonClass,
} from "./register-ui";

type RegistrationSuccessProps = {
  result: CreateSalonRegistrationResult;
  /** When true, auto-redirect to the owner dashboard */
  autoRedirect?: boolean;
};

export function RegistrationSuccess({
  result,
  autoRedirect = true,
}: RegistrationSuccessProps) {
  const router = useRouter();
  const dashboardPath = result.dashboardPath || "/platform/salon";

  useEffect(() => {
    if (!autoRedirect) return;
    const timer = window.setTimeout(() => {
      router.replace(dashboardPath);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [autoRedirect, dashboardPath, router]);

  return (
    <div className="mx-auto max-w-lg space-y-8 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <CheckCircle2 className="size-8" strokeWidth={1.6} />
      </div>

      <header className="space-y-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Step 6 of 6 · Done
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
          Your salon is ready
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-600">
          Opening your dashboard…
        </p>
      </header>

      <div className="rounded-[24px] border border-neutral-200 bg-white p-6 text-left shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Public page
        </p>
        <p className="mt-2 break-all font-mono text-[14px] text-neutral-900">
          {result.publicUrl}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={dashboardPath}
          className={`${registerPrimaryButtonClass} inline-flex`}
        >
          <LayoutDashboard className="mr-2 size-4" />
          Go to dashboard
        </Link>
        <Link
          href={result.publicPath}
          className={registerSecondaryButtonClass}
          target="_blank"
          rel="noreferrer"
        >
          View public page
        </Link>
      </div>
    </div>
  );
}
