import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  canAccessMarketplacePreview,
  isPrivatePreviewEnabled,
} from "@/features/private-preview";

export const metadata: Metadata = {
  title: "Documentation (KO)",
  robots: { index: false, follow: false },
};

/** Locale shell — content is written manually under /docs/ko. */
export default async function DocsKoPage() {
  if (isPrivatePreviewEnabled()) {
    const allowed = await canAccessMarketplacePreview();
    if (!allowed) {
      redirect("/platform/login");
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Documentation — 한국어
      </h1>
      <p className="mt-4 text-sm text-neutral-600">
        공식 문서는 이 경로에 수동으로 작성됩니다.
      </p>
      <p className="mt-10 text-sm text-neutral-500">
        <Link href="/docs" className="underline underline-offset-4">
          모든 언어
        </Link>
      </p>
    </div>
  );
}
