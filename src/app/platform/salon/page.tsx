import { SalonDashboardHome } from "@/features/dashboard/salon-dashboard-shell";
import { getDashboard } from "@/features/dashboard/getDashboard";
import { redirect } from "next/navigation";

export default async function SalonOwnerDashboardPage() {
  const result = await getDashboard();

  if (result.status === "unauthenticated") {
    redirect("/login?next=/platform/salon");
  }

  if (result.status === "error") {
    return (
      <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {result.error}
      </p>
    );
  }

  if (result.status === "no_salon") {
    return null;
  }

  return <SalonDashboardHome data={result.data} />;
}
