import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SalonDashboardShell } from "@/features/dashboard/salon-dashboard-shell";
import { getOwnerSalonContext } from "@/features/dashboard/getOwnerSalon";

export const metadata: Metadata = {
  title: "Salon dashboard",
  robots: { index: false, follow: false },
};

function NoSalonLinked() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F7F8FA] px-4">
      <div className="max-w-md rounded-[24px] border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-950">
          No salon linked
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your account is signed in, but it is not linked to a salon owner
          profile yet. Register a salon or ask support to link{" "}
          <code className="text-xs">salon_owners.auth_user_id</code>.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white"
          >
            Register a salon
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-full border border-neutral-200 px-4 text-sm font-semibold text-neutral-800"
          >
            Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function SalonOwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getOwnerSalonContext();

  if (context.status === "unauthenticated") {
    redirect("/login?next=/platform/salon");
  }

  if (context.status === "error") {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {context.error}
        </p>
      </div>
    );
  }

  if (context.status === "no_salon") {
    return <NoSalonLinked />;
  }

  return (
    <SalonDashboardShell session={context.session}>{children}</SalonDashboardShell>
  );
}
