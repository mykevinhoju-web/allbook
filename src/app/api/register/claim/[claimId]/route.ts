import { NextResponse } from "next/server";

import { getClaimVerificationStatus } from "@/features/claim-verification/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Params = { params: Promise<{ claimId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { claimId } = await params;
    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const service = createServiceSupabase();
    const status = await getClaimVerificationStatus(service, {
      claimId,
      authUserId: user.id,
    });

    // Refresh email verification from auth if claim lacks it.
    if (!status.claim.emailVerifiedAt && user.email_confirmed_at) {
      await service
        .from("salon_claim_requests" as never)
        .update({
          account_email_verified_at: user.email_confirmed_at,
          status:
            status.claim.status === "pending"
              ? "business_verification_required"
              : status.claim.status,
          verification_state: "email_verified",
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id" as never, claimId)
        .eq("auth_user_id" as never, user.id);

      const refreshed = await getClaimVerificationStatus(service, {
        claimId,
        authUserId: user.id,
      });
      return NextResponse.json(refreshed);
    }

    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed.";
    const status = /unauthorized/i.test(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
