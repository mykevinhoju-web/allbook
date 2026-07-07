import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { validateStaffPin } from "@/lib/staff-pin";

const LOGIN_ID_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id: staffId } = await params;
    const supabase = createServiceSupabase();

    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (!staff) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const { data: account, error } = await supabase
      .from("staff_accounts")
      .select("login_id")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      loginId: account?.login_id ?? null,
      hasAccount: Boolean(account),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id: staffId } = await params;
    const body = (await request.json()) as {
      loginId?: string;
      password?: string;
    };

    const loginId = body.loginId?.trim();
    if (!loginId) {
      return NextResponse.json({ error: "Login ID is required." }, { status: 400 });
    }

    if (!LOGIN_ID_PATTERN.test(loginId)) {
      return NextResponse.json(
        {
          error:
            "Login ID must be 3–32 characters (letters, numbers, . _ - only).",
        },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();

    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (!staff) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("staff_accounts")
      .select("id, password_hash")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .maybeSingle();

    const password = body.password?.trim() ?? "";
    if (!existing && !password) {
      return NextResponse.json(
        { error: "Password is required when creating a new login." },
        { status: 400 },
      );
    }

    if (password) {
      const pinError = validateStaffPin(password);
      if (pinError) {
        return NextResponse.json({ error: pinError }, { status: 400 });
      }
    }

    const passwordHash = password
      ? await hash(password, 10)
      : (existing?.password_hash ?? null);

    if (!passwordHash) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (existing) {
      const { error } = await supabase
        .from("staff_accounts")
        .update({
          login_id: loginId,
          password_hash: passwordHash,
          updated_at: now,
        })
        .eq("id", existing.id)
        .eq("tenant_id", tenant.id);

      if (error) {
        const isDuplicate = error.message.includes("staff_accounts_tenant_id_login_id_key");
        return NextResponse.json(
          {
            error: isDuplicate
              ? "This login ID is already in use."
              : error.message,
          },
          { status: isDuplicate ? 409 : 503 },
        );
      }
    } else {
      const { error } = await supabase.from("staff_accounts").insert({
        tenant_id: tenant.id,
        staff_id: staffId,
        login_id: loginId,
        password_hash: passwordHash,
      });

      if (error) {
        const isDuplicate = error.message.includes("staff_accounts_tenant_id_login_id_key");
        return NextResponse.json(
          {
            error: isDuplicate
              ? "This login ID is already in use."
              : error.message,
          },
          { status: isDuplicate ? 409 : 503 },
        );
      }
    }

    return NextResponse.json({ ok: true, loginId });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
