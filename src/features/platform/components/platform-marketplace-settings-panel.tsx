"use client";

import Link from "next/link";
import { Store } from "lucide-react";

import { DEFAULT_OWNER_KEYWORD_LIMIT } from "@/features/business";

/**
 * Platform settings overview — keyword upgrades are per paying salon.
 */
export function PlatformMarketplaceSettingsPanel() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          Platform
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Marketplace defaults and paid upgrades.
        </p>
      </div>

      <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
          Owner search keywords
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Every salon starts with{" "}
          <strong className="font-semibold text-neutral-900">
            {DEFAULT_OWNER_KEYWORD_LIMIT} free keywords
          </strong>
          . Extra keyword slots are sold upgrades — set the limit on each paying
          salon in Businesses, not globally for everyone.
        </p>
        <Link
          href="/platform/businesses"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <Store className="size-4" />
          Open Businesses
        </Link>
      </section>
    </div>
  );
}
