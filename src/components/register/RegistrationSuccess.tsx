"use client";

import Link from "next/link";
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
  const dashboardPath = result.dashboardPath || "/register/pending";

  useEffect(() => {
    if (!autoRedirect) return;
    const delay = result.reviewRequired || !result.canLogin ? 3200 : 900;
    const timer = window.setTimeout(() => {
      window.location.assign(dashboardPath);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    autoRedirect,
    dashboardPath,
    result.reviewRequired,
    result.canLogin,
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-8 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <CheckCircle2 className="size-8" strokeWidth={1.6} />
      </div>

      <header className="space-y-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Step 6 of 6 · Submitted
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
          Waiting for AllBook approval
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-600">
          {result.claimedExisting
            ? "We matched an existing AllBook listing. Next, verify you control the business (website or phone). Google data alone does not prove ownership."
            : "Your application was submitted. Complete business-control verification to unlock owner access. Until then the listing stays hidden from search if it is brand new."}
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
          View pending status
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
