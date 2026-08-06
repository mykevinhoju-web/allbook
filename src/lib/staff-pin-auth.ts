import { compare } from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { validateStaffPin } from "./staff-pin";

export type StaffAccountPinRow = {
  staff_id: string;
  login_id: string;
  password_hash: string;
  pin: string | null;
};

/** Internal login_id stored in DB; staff never types this. */
export function internalStaffLoginId(staffId: string): string {
  return staffId.replace(/-/g, "");
}

export async function findStaffAccountsByPin(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  pin: string,
): Promise<StaffAccountPinRow[]> {
  const pinError = validateStaffPin(pin);
  if (pinError) {
    return [];
  }

  const { data: accounts, error } = await supabase
    .from("staff_accounts")
    .select("staff_id, login_id, password_hash, pin")
    .eq("tenant_id", tenantId);

  if (error || !accounts?.length) {
    return [];
  }

  const matches: StaffAccountPinRow[] = [];
  for (const account of accounts) {
    if (account.pin === pin) {
      matches.push(account);
      continue;
    }
    const ok = await compare(pin, account.password_hash);
    if (ok) {
      matches.push(account);
    }
  }

  return matches;
}

export async function isPinUsedByOtherStaff(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  pin: string,
  excludeStaffId?: string,
): Promise<boolean> {
  const matches = await findStaffAccountsByPin(supabase, tenantId, pin);
  return matches.some((row) => row.staff_id !== excludeStaffId);
}
