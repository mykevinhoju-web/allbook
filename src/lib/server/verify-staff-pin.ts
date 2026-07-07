import { compare } from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export async function verifyStaffPin(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  staffId: string,
  pin: string,
): Promise<boolean> {
  const { data: account } = await supabase
    .from("staff_accounts")
    .select("password_hash")
    .eq("tenant_id", tenantId)
    .eq("staff_id", staffId)
    .maybeSingle();

  if (!account?.password_hash) {
    return false;
  }

  return compare(pin, account.password_hash);
}
