import type { Metadata } from "next";

import { ensureDefaultBookingPolicy } from "@/features/booking-policy";
import {
  BusinessSettingsShell,
  ensureDefaultSalonSettings,
  parseSettingsGroupParam,
} from "@/features/business-settings";
import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import { getServices } from "@/features/salon-services/getServices";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Business settings",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ group?: string }>;
};

export default async function SalonSettingsPage({ searchParams }: PageProps) {
  const owner = await requireOwnerSalon("/platform/salon/settings");
  const params = await searchParams;
  const group = parseSettingsGroupParam(params.group);
  const supabase = createServiceSupabase();

  await ensureDefaultSalonSettings(supabase, owner.salon.id);
  const policy = await ensureDefaultBookingPolicy(supabase, owner.salon.id);
  const services = await getServices(supabase, {
    salonId: owner.salon.id,
    includeArchived: false,
  });

  return (
    <BusinessSettingsShell
      salonId={owner.salon.id}
      initialGroup={group}
      policy={policy}
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        price: s.price,
      }))}
    />
  );
}
