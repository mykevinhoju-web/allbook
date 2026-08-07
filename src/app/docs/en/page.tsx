import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { canAccessMarketplacePreview } from "@/features/private-preview/access";
import { isPrivatePreviewEnabled } from "@/features/private-preview";

export const metadata: Metadata = {
  title: "Documentation (EN)",
  robots: { index: false, follow: false },
};

/** Locale shell — content is written manually under /docs/en. */
export default async function DocsEnPage() {
  if (isPrivatePreviewEnabled()) {
    const allowed = await canAccessMarketplacePreview();
    if (!allowed) {
      redirect("/platform/login");
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Documentation — English
      </h1>
      <p className="mt-4 text-sm text-neutral-600">
        Official documentation will be added here manually.
      </p>
      <p className="mt-10 text-sm text-neutral-500">
        <Link href="/docs" className="underline underline-offset-4">
          All locales
        </Link>
      </p>
    </div>
  );
}
