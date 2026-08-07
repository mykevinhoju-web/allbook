import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  canAccessMarketplacePreview,
  isPrivatePreviewEnabled,
} from "@/features/private-preview";

export const metadata: Metadata = {
  title: "Documentation",
  robots: { index: false, follow: false },
};

/**
 * Future documentation section entry.
 * Locale folders: /docs/en, /docs/ko, /docs/zh (manual content only).
 * No generated documentation bodies here.
 */
export default async function DocsIndexPage() {
  if (isPrivatePreviewEnabled()) {
    const allowed = await canAccessMarketplacePreview();
    if (!allowed) {
      redirect("/platform/login");
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
        AllBook
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">
        Documentation
      </h1>
      <ul className="mt-8 space-y-3 text-sm text-neutral-700">
        <li>
          <Link href="/docs/en" className="underline underline-offset-4">
            English — /docs/en
          </Link>
        </li>
        <li>
          <Link href="/docs/ko" className="underline underline-offset-4">
            한국어 — /docs/ko
          </Link>
        </li>
        <li>
          <Link href="/docs/zh" className="underline underline-offset-4">
            中文 — /docs/zh
          </Link>
        </li>
      </ul>
      <p className="mt-10 text-sm text-neutral-500">
        <Link href="/" className="underline underline-offset-4">
          Back
        </Link>
      </p>
    </div>
  );
}
