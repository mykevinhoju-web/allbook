import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PartnerPortal } from "@/features/marketplace-partner/components/partner-portal";
import {
  getPartnerByAuthUserId,
  requireAuthUser,
  PartnerAuthError,
} from "@/features/marketplace-partner";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Partner portal",
  robots: { index: false, follow: false },
};

export default async function PartnerPage() {
  try {
    const user = await requireAuthUser();
    const supabase = createServiceSupabase();
    const partner = await getPartnerByAuthUserId(user.id, supabase);

    const session = await createClient();
    const { data: ownerships } = await session
      .from("salon_owners")
      .select("salon_id")
      .eq("auth_user_id", user.id);

    const salonIds = (ownerships ?? []).map((row) => row.salon_id);
    let ownedSalons: { id: string; name: string }[] = [];
    if (salonIds.length) {
      const { data: salons } = await supabase
        .from("salons")
        .select("id, name")
        .in("id", salonIds);
      ownedSalons = (salons ?? []).map((s) => ({ id: s.id, name: s.name }));
    }

    return (
      <PartnerPortal initialPartner={partner} ownedSalons={ownedSalons} />
    );
  } catch (error) {
    if (error instanceof PartnerAuthError && error.status === 401) {
      redirect("/login?next=/partner");
    }
    throw error;
  }
}
