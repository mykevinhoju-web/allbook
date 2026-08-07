import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  canAccessMarketplacePreview,
  isPrivatePreviewEnabled,
} from "@/features/private-preview";

export const metadata: Metadata = {
  title: "Documentation (ZH)",
  robots: { index: false, follow: false },
};

/** Locale shell — content is written manually under /docs/zh. */
export default async function DocsZhPage() {
  if (isPrivatePreviewEnabled()) {
    const allowed = await canAccessMarketplacePreview();
    if (!allowed) {
      redirect("/platform/login");
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Documentation — 中文
      </h1>
      <p className="mt-4 text-sm text-neutral-600">
        官方文档将在此路径手动编写。
      </p>
      <p className="mt-10 text-sm text-neutral-500">
        <Link href="/docs" className="underline underline-offset-4">
          所有语言
        </Link>
      </p>
    </div>
  );
}
