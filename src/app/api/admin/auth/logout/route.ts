import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getAdminSessionCookieName } from "@/lib/admin-session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getAdminSessionCookieName());
  return NextResponse.json({ ok: true });
}
