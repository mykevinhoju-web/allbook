import Link from "next/link";

import { PRIVATE_PREVIEW_DOCS_HREF } from "./config";

type Props = {
  isPlatformAdmin?: boolean;
};

/**
 * Public-facing Private Preview landing.
 * Real Marketplace remains intact behind admin auth.
 */
export function PrivatePreviewLanding({ isPlatformAdmin = false }: Props) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#F7F5F1] text-neutral-950">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-500">
          AllBook
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          Private Preview
        </h1>
        <p className="mt-4 text-lg text-neutral-600">Launching Soon</p>
        <a
          href="mailto:hello@allbook.com.au?subject=AllBook%20Early%20Access"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Request Early Access
        </a>
        {isPlatformAdmin ? (
          <p className="mt-8 text-sm text-neutral-500">
            Signed in as platform admin.{" "}
            <Link
              href="/platform"
              className="font-medium text-neutral-900 underline underline-offset-4"
            >
              Open Admin
            </Link>
            {" · "}
            <Link
              href="/hair"
              className="font-medium text-neutral-900 underline underline-offset-4"
            >
              View Marketplace
            </Link>
          </p>
        ) : (
          <p className="mt-8 text-sm text-neutral-500">
            Administrators:{" "}
            <Link
              href="/platform/login"
              className="font-medium text-neutral-900 underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        )}
      </main>
      <footer className="border-t border-neutral-200/80">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-6 py-8 text-sm text-neutral-500 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} AllBook</p>
          {isPlatformAdmin ? (
            <Link
              href={PRIVATE_PREVIEW_DOCS_HREF}
              className="font-medium text-neutral-800 underline underline-offset-4"
            >
              Documentation
            </Link>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
