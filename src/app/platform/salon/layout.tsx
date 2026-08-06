import type { Metadata } from "next";

import { SalonDashboardShell } from "@/features/dashboard/salon-dashboard-shell";
import { getDashboard } from "@/features/dashboard/getDashboard";

export const metadata: Metadata = {
  title: "Salon dashboard",
  robots: { index: false, follow: false },
};

export default async function SalonOwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getDashboard();

  return (
    <SalonDashboardShell session={data.session}>{children}</SalonDashboardShell>
  );
}
