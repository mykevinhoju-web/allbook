"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type SalonDetailErrorProps = {
  message?: string;
};

export function SalonDetailError({
  message = "Something went wrong loading this salon.",
}: SalonDetailErrorProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#F6F6F7] px-4 text-center">
      <p className="text-lg font-semibold text-neutral-950">
        Couldn’t load salon
      </p>
      <p className="mt-2 max-w-md text-sm text-neutral-500">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white"
        >
          Retry
        </button>
        <Link
          href="/search"
          className="inline-flex h-11 items-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-800"
        >
          Back to search
        </Link>
      </div>
    </div>
  );
}

export function SalonNotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#F6F6F7] px-4 text-center">
      <p className="text-lg font-semibold text-neutral-950">Salon not found</p>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        This salon may have moved or is no longer listed.
      </p>
      <Link
        href="/search"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white"
      >
        Browse salons
      </Link>
    </div>
  );
}
