import { compare, hash } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import type { Database } from "@/types/database";
import {
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
  signAdminSession,
} from "@/lib/admin-session";

async function verifyAdminPassword(
  tenantId: string,
  loginId: string,
  password: string,
): Promise<{ adminId: string; loginId: string } | null> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as { loginId?: string; password?: string };

    if (!body.loginId?.trim() || !body.password) {
      return NextResponse.json(
        { error: "loginId and password are required." },
        { status: 400 },
      );
    }

    const verified = await verifyAdminPassword(
      tenant.id,
      body.loginId.trim(),
      body.password,
    );

    if (!verified) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signAdminSession({
      role: "admin",
      tenantSlug: tenant.slug,
      tenantId: tenant.id,
      adminId: verified.adminId,
      loginId: verified.loginId,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      getAdminSessionCookieName(),
      token,
      getAdminSessionCookieOptions(),
    );
    return response;
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.includes("SESSION_SECRET")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}

/** Bootstrap helper: create admin account in DB (env credentials only). */
export async function PUT(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as { loginId?: string; password?: string };

    const envLoginId = process.env.ADMIN_LOGIN_ID?.trim();
    const envPassword = process.env.ADMIN_PASSWORD;
    if (!envLoginId || !envPassword) {
      return NextResponse.json(
        { error: "ADMIN_LOGIN_ID and ADMIN_PASSWORD env vars are required." },
        { status: 503 },
      );
    }

    if (body.loginId !== envLoginId || body.password !== envPassword) {
      return NextResponse.json({ error: "Invalid bootstrap credentials." }, { status: 401 });
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const passwordHash = await hash(envPassword, 10);
    const { error } = await supabase.from("admin_accounts").upsert(
      {
        tenant_id: tenant.id,
        login_id: envLoginId,
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,login_id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
