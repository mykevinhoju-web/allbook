"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";

import type { CreateSalonRegistrationResult } from "@/features/salon-registration";

import { registerPrimaryButtonClass, registerSecondaryButtonClass } from "./register-ui";

type RegistrationSuccessProps = {
  result: CreateSalonRegistrationResult;
};

export function RegistrationSuccess({ result }: RegistrationSuccessProps) {
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
          Your salon is live
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-600">
          We created your public page and owner account. Next you can add
          services, photos, and open bookings — payment setup comes later.
        </p>
      </header>

      <div className="rounded-[24px] border border-neutral-200 bg-white p-6 text-left shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Public URL
        </p>
        <p className="mt-2 break-all font-mono text-[14px] text-neutral-900">
          {result.publicUrl}
        </p>
        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Slug
        </p>
        <p className="mt-2 font-mono text-[14px] text-neutral-900">
          {result.slug}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={result.publicPath}
          className={`${registerPrimaryButtonClass} inline-flex`}
          target="_blank"
          rel="noreferrer"
        >
          View public page
          <ExternalLink className="ml-2 size-4" />
        </Link>
        <Link href="/platform/login" className={registerSecondaryButtonClass}>
          Go to platform login
        </Link>
      </div>
    </div>
  );
}
