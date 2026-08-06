import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SalonDashboardShell } from "@/features/dashboard/salon-dashboard-shell";
import { getOwnerSalonContext } from "@/features/dashboard/getOwnerSalon";

export const metadata: Metadata = {
  title: "Salon dashboard",
  robots: { index: false, follow: false },
};

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
    redirect("/register");
  }

  return (
    <SalonDashboardShell session={context.session}>{children}</SalonDashboardShell>
  );
}
