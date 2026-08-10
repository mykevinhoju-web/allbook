import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { ClaimAuditEvent, ClaimVerificationMethod } from "./core";

type AnySupabase = SupabaseClient<Database>;

export async function recordClaimEvent(
  supabase: AnySupabase,
  input: {
    claimId: string;
    salonId?: string | null;
    authUserId?: string | null;
    event: ClaimAuditEvent;
    verificationMethod?: ClaimVerificationMethod | null;
    result?: string | null;
    details?: Record<string, unknown>;
  },
): Promise<void> {
  // Never persist secrets — callers must strip tokens/OTPs from details.
  const details = { ...(input.details ?? {}) };
  delete details.token;
  delete details.otp;
  delete details.password;
  delete details.password_hash;
  delete details.token_hash;

  await supabase.from("salon_claim_events" as never).insert({
    claim_id: input.claimId,
    salon_id: input.salonId ?? null,
    auth_user_id: input.authUserId ?? null,
    event: input.event,
    verification_method: input.verificationMethod ?? null,
    result: input.result ?? null,
    details,
  } as never);
}
