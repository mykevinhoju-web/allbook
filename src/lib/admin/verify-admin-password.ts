import { compare } from "bcryptjs";

import { createServiceSupabase } from "@/lib/supabase/service";

export async function verifyAdminPassword(
  tenantId: string,
  loginId: string,
  password: string,
): Promise<{ adminId: string; loginId: string } | null> {
  const supabase = createServiceSupabase();

  const { data: account } = await supabase
    .from("admin_accounts")
    .select("id, login_id, password_hash")
    .eq("tenant_id", tenantId)
    .eq("login_id", loginId)
    .maybeSingle();

  if (account) {
    const ok = await compare(password, account.password_hash);
    if (ok) {
      return { adminId: account.id, loginId: account.login_id };
    }
    return null;
  }

  const envLoginId = process.env.ADMIN_LOGIN_ID?.trim();
  const envPassword = process.env.ADMIN_PASSWORD;
  if (
    envLoginId &&
    envPassword &&
    loginId === envLoginId &&
    password === envPassword
  ) {
    return { adminId: "env-admin", loginId: envLoginId };
  }

  return null;
}
