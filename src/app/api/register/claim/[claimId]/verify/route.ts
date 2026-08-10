import { NextResponse } from "next/server";

import {
  confirmPhoneVerification,
  confirmPostalVerification,
  confirmWebsiteVerificationWithToken,
  requestPostalVerification,
  startPhoneVerification,
  startWebsiteVerification,
} from "@/features/claim-verification";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Params = { params: Promise<{ claimId: string }> };

type Body = {
  action?: string;
  token?: string;
  otp?: string;
  code?: string;
  phone?: string;
  preferGoogleListed?: boolean;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { claimId } = await params;
    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        {
          error:
            "Verify your AllBook account email before starting business verification.",
        },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Body;
    const service = createServiceSupabase();

    // Ensure claim email flag is set from the authenticated session (server-side).
    await service
      .from("salon_claim_requests" as never)
      .update({
        account_email_verified_at: user.email_confirmed_at,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, claimId)
      .eq("auth_user_id" as never, user.id);

    switch (body.action) {
      case "start_website": {
        const result = await startWebsiteVerification(service, {
          claimId,
          authUserId: user.id,
        });
        return NextResponse.json(result);
      }
      case "confirm_website": {
        if (!body.token?.trim()) {
          return NextResponse.json(
            { error: "Verification token is required." },
            { status: 400 },
          );
        }
        const result = await confirmWebsiteVerificationWithToken(service, {
          claimId,
          authUserId: user.id,
          token: body.token.trim(),
        });
        return NextResponse.json(result);
      }
      case "start_phone": {
        if (!body.phone?.trim()) {
          return NextResponse.json(
            { error: "Business phone is required." },
            { status: 400 },
          );
        }
        const result = await startPhoneVerification(service, {
          claimId,
          authUserId: user.id,
          phone: body.phone.trim(),
          preferGoogleListed: Boolean(body.preferGoogleListed),
        });
        return NextResponse.json(result);
      }
      case "confirm_phone": {
        if (!body.otp?.trim()) {
          return NextResponse.json(
            { error: "OTP is required." },
            { status: 400 },
          );
        }
        const result = await confirmPhoneVerification(service, {
          claimId,
          authUserId: user.id,
          otp: body.otp.trim(),
          method: body.preferGoogleListed
            ? "google_business_phone"
            : "business_phone",
        });
        return NextResponse.json(result);
      }
      case "start_postal": {
        const result = await requestPostalVerification(service, {
          claimId,
          authUserId: user.id,
        });
        return NextResponse.json(result);
      }
      case "confirm_postal": {
        if (!body.code?.trim()) {
          return NextResponse.json(
            { error: "Postal code is required." },
            { status: 400 },
          );
        }
        const result = await confirmPostalVerification(service, {
          claimId,
          authUserId: user.id,
          code: body.code.trim(),
        });
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          { error: "Unknown verification action." },
          { status: 400 },
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed.";
    const status = /unauthorized/i.test(message)
      ? 401
      : /too many|expired|invalid/i.test(message)
        ? 400
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
