import { redirect } from "next/navigation";

import { SalonDashboardHome } from "@/features/dashboard/salon-dashboard-shell";
import { getDashboard } from "@/features/dashboard/getDashboard";

export default async function SalonOwnerDashboardPage() {
  const result = await getDashboard();

  if (result.status === "unauthenticated") {
    redirect("/login?next=/platform/salon");
  }

  if (result.status === "no_salon") {
    redirect("/register");
  }

  if (result.status === "error") {
    return (
      <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {result.error}
      </p>
    );
  }

  return <SalonDashboardHome data={result.data} />;
}
