import { NextResponse } from "next/server";

import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import { verifyAdminPassword } from "@/lib/admin/verify-admin-password";
import {
  getAdminReportsUnlockCookieName,
  getAdminReportsUnlockCookieOptions,
  isAdminReportsUnlocked,
  signAdminReportsUnlock,
} from "@/lib/admin-reports-unlock";

function clearUnlockResponse(host: string | null) {
  const response = NextResponse.json({ ok: true, unlocked: false });
  response.cookies.set(getAdminReportsUnlockCookieName(), "", {
    ...getAdminReportsUnlockCookieOptions(host),
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  try {
    const { tenant, actor } = await requireTenantAndAdminActor(request);
    if (actor.role !== "admin") {
      return NextResponse.json({ unlocked: false }, { status: 403 });
    }

    const unlocked = await isAdminReportsUnlocked(request, {
      tenantId: tenant.id,
      adminId: actor.adminId,
    });
    return NextResponse.json({ unlocked });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { tenant, actor } = await requireTenantAndAdminActor(request);
    if (actor.role !== "admin") {
      return NextResponse.json(
        { error: "Admin password required.", code: "REPORTS_LOCKED" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { password?: string };
    const password = body.password ?? "";
    if (!password) {
      return NextResponse.json(
        { error: "Enter the admin password." },
        { status: 400 },
      );
    }

    const verified = await verifyAdminPassword(
      tenant.id,
      actor.loginId,
      password,
    );
    if (!verified) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 },
      );
    }

    const token = await signAdminReportsUnlock({
      purpose: "admin-reports",
      tenantId: tenant.id,
      adminId: actor.adminId,
      loginId: actor.loginId,
    });

    const response = NextResponse.json({ ok: true, unlocked: true });
    response.cookies.set(
      getAdminReportsUnlockCookieName(),
      token,
      getAdminReportsUnlockCookieOptions(request.headers.get("host")),
    );
    return response;
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function DELETE(request: Request) {
  return clearUnlockResponse(request.headers.get("host"));
}
