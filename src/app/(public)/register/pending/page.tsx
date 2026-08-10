import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Registration pending",
  robots: { index: false, follow: false },
};

/**
 * Shown after a salon claim / registration is submitted.
 * Owner dashboard login is blocked until platform admin approves ownership.
 */
export default function RegisterPendingPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F7F4EF] px-5 py-16">
      <div className="w-full max-w-lg rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          AllBook
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-neutral-950">
          Verification pending
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
          Your registration was submitted and is waiting for AllBook approval.
          Until then you cannot manage the salon or turn on online booking.
        </p>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[14px] text-neutral-600">
          <li>
            If your salon was already listed, we keep that listing (including
            reviews) and only attach ownership after approval.
          </li>
          <li>
            Brand-new salons stay hidden from search until ownership is
            verified.
          </li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white"
          >
            Back to AllBook
          </Link>
        </div>
        <p className="mt-4 text-[13px] text-neutral-500">
          After approval, sign in at{" "}
          <Link href="/login" className="underline underline-offset-2">
            /login
          </Link>{" "}
          with the email and password you registered.
        </p>
      </div>
    </div>
  );
}
