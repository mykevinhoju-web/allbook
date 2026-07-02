import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getStaffSessionCookieName } from "@/lib/staff-session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getStaffSessionCookieName());
  return NextResponse.json({ ok: true });
}
