import type { Metadata } from "next";

import {
  BusinessProfileManager,
  getBusiness,
  PLATFORM_DEMO_SALON_SLUG,
} from "@/features/business";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Business",
  robots: { index: false, follow: false },
};

export default async function SalonBusinessPage() {
  const supabase = await createClient();
  const { business, error } = await getBusiness(supabase, {
    slug: PLATFORM_DEMO_SALON_SLUG,
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
          No salon found for slug “{PLATFORM_DEMO_SALON_SLUG}”.
        </p>
      </div>
    );
  }

  return <BusinessProfileManager initialBusiness={business} />;
}
