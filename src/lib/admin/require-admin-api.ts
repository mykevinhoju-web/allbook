import { NextResponse } from "next/server";

import type { Tenant } from "@/features/tenants/types";
import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-session";
import {
  getStaffSessionCookieName,
  verifyStaffSession,
} from "@/lib/staff-session";

import {
  requireTenantFromRequest,
  TenantContextError,
} from "./tenant-context";

export type { TenantContextError };

export type AdminApiActor =
  | {
      role: "admin";
      tenantId: string;
      loginId: string;
      adminId: string;
    }
  | {
      role: "staff";
      tenantId: string;
      staffId: string;
      loginId: string;
    };

export class AdminApiAuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AdminApiAuthError";
  }
}

export async function requireAdminApiActor(
  request: Request,
  tenantId: string,
  options: { allowStaff?: boolean } = {},
): Promise<AdminApiActor> {
  const { allowStaff = false } = options;
  const adminCookieName = getAdminSessionCookieName();
  const adminToken = readCookieFromRequest(request, adminCookieName);
  if (adminToken) {
    const admin = await verifyAdminSession(adminToken);
    if (admin?.tenantId === tenantId) {
      return {
        role: "admin",
        tenantId: admin.tenantId,
        loginId: admin.loginId,
        adminId: admin.adminId,
      };
    }
  }

  if (allowStaff) {
    const staffCookieName = getStaffSessionCookieName();
    const staffToken = readCookieFromRequest(request, staffCookieName);
    if (staffToken) {
      const staff = await verifyStaffSession(staffToken);
      if (staff?.tenantId === tenantId) {
        return {
          role: "staff",
          tenantId: staff.tenantId,
          staffId: staff.staffId,
          loginId: staff.loginId,
        };
      }
    }
  }

  throw new AdminApiAuthError("Unauthorized.", 401);
}

export async function requireTenantAndAdminActor(
  request: Request,
  options: { allowStaff?: boolean } = {},
): Promise<{ tenant: Tenant; actor: AdminApiActor }> {
  const tenant = await requireTenantFromRequest(request);
  const actor = await requireAdminApiActor(request, tenant.id, options);
  return { tenant, actor };
}

export function isAdminApiAuthError(
  error: unknown,
): error is AdminApiAuthError {
  return error instanceof AdminApiAuthError;
}

/** Shared guard for admin API route catch blocks. */
export function handleAdminRouteError(error: unknown) {
  if (error instanceof TenantContextError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  if (error instanceof AdminApiAuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  return null;
}
