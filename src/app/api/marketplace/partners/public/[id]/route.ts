import { NextResponse } from "next/server";

import {
  getPartnerAvailability,
  getPartnerById,
  listPartnerAreas,
  listPartnerServices,
  toPublicPartner,
} from "@/features/marketplace-partner";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Public partner detail — active only, no email/phone PII.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createServiceSupabase();
    const partner = await getPartnerById(id, supabase);
    const publicPartner = partner ? toPublicPartner(partner) : null;
    if (!publicPartner) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const [services, areas, availability] = await Promise.all([
      listPartnerServices({ supabase, partnerId: id }),
      listPartnerAreas({ supabase, partnerId: id }),
      getPartnerAvailability({ supabase, partnerId: id }),
    ]);

    return NextResponse.json({
      partner: {
        ...publicPartner,
        partnerType: partner!.partnerType,
        salonId: partner!.salonId,
        linkedBusiness: Boolean(partner!.salonId),
      },
      services: services.filter((s) => s.isActive),
      areas,
      availability: availability
        ? {
            timezone: availability.timezone,
            weeklyWindows: availability.weeklyWindows,
            capacityPerSlot: availability.capacityPerSlot,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed." },
      { status: 400 },
    );
  }
}
