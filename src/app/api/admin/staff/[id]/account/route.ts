import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import {
  internalStaffLoginId,
  isPinUsedByOtherStaff,
} from "@/lib/staff-pin-auth";
import { validateStaffPin } from "@/lib/staff-pin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
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
      .select("id, pin")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      hasAccount: Boolean(account),
      pin: account?.pin ?? null,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { id: staffId } = await params;
    const body = (await request.json()) as {
      pin?: string;
      password?: string;
    };

    const pin = (body.pin ?? body.password ?? "").trim();
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
      .select("id, password_hash, pin")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .maybeSingle();

    if (!existing && !pin) {
      return NextResponse.json(
        { error: "PIN is required when creating staff login." },
        { status: 400 },
      );
    }

    if (pin) {
      const pinError = validateStaffPin(pin);
      if (pinError) {
        return NextResponse.json({ error: pinError }, { status: 400 });
      }

      const duplicate = await isPinUsedByOtherStaff(
        supabase,
        tenant.id,
        pin,
        staffId,
      );
      if (duplicate) {
        return NextResponse.json(
          { error: "This PIN is already assigned to another staff member." },
          { status: 409 },
        );
      }
    }

    const passwordHash = pin
      ? await hash(pin, 10)
      : (existing?.password_hash ?? null);
    const pinValue = pin || existing?.pin || null;

    if (!passwordHash) {
      return NextResponse.json({ error: "PIN is required." }, { status: 400 });
    }

    const loginId = internalStaffLoginId(staffId);
    const now = new Date().toISOString();

    if (existing) {
      const { error } = await supabase
        .from("staff_accounts")
        .update({
          login_id: loginId,
          password_hash: passwordHash,
          pin: pinValue,
          updated_at: now,
        })
        .eq("id", existing.id)
        .eq("tenant_id", tenant.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
    } else {
      const { error } = await supabase.from("staff_accounts").insert({
        tenant_id: tenant.id,
        staff_id: staffId,
        login_id: loginId,
        password_hash: passwordHash,
        pin: pinValue,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
    }

    return NextResponse.json({
      ok: true,
      hasAccount: true,
      pin: pinValue,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
