import type { Metadata } from "next";

import {
  BookingPolicySettingsPanel,
  ensureDefaultBookingPolicy,
} from "@/features/booking-policy";
import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import { getServices } from "@/features/salon-services/getServices";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Booking & payment policy",
  robots: { index: false, follow: false },
};

export default async function SalonSettingsPage() {
  const owner = await requireOwnerSalon("/platform/salon/settings");
  const supabase = createServiceSupabase();
  const policy = await ensureDefaultBookingPolicy(supabase, owner.salon.id);
  const services = await getServices(supabase, {
    salonId: owner.salon.id,
    includeArchived: false,
  });

  return (
    <BookingPolicySettingsPanel
      salonId={owner.salon.id}
      initialPolicy={policy}
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        price: s.price,
      }))}
    />
  );
}
