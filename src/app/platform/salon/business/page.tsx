import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BusinessProfileManager, getBusiness } from "@/features/business";
import { getOwnerSalonContext } from "@/features/dashboard/getOwnerSalon";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Business",
  robots: { index: false, follow: false },
};

export default async function SalonBusinessPage() {
  const context = await getOwnerSalonContext();
  if (context.status === "unauthenticated") {
    redirect("/login?next=/platform/salon/business");
  }
  if (context.status === "error") {
    return (
      <div className="px-4 py-10 sm:px-6">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {context.error}
        </p>
      </div>
    );
  }
  if (context.status === "no_salon") {
    return (
      <div className="px-4 py-10 sm:px-6">
        <p className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
          No salon linked to this account.{" "}
          <Link href="/register" className="font-semibold underline">
            Register a salon
          </Link>
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { business, error } = await getBusiness(supabase, {
    salonId: context.salon.id,
  });

  if (error) {
    return (
      <div className="px-4 py-10 sm:px-6">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Could not load business profile: {error}
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="px-4 py-10 sm:px-6">
        <p className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
          Salon not found.
        </p>
      </div>
    );
  }

  return <BusinessProfileManager initialBusiness={business} />;
}
