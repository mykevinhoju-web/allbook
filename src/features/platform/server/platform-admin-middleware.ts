import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/types/database";

/**
 * Refresh Supabase session and return whether the user is an AllBook Admin
 * (profiles.role = 'admin'). Used to gate /platform in middleware.
 */
export async function resolvePlatformAdminAccess(
  request: NextRequest,
  requestHeaders?: Headers,
): Promise<{
  response: NextResponse;
  isAdmin: boolean;
  hasUser: boolean;
}> {
  const baseHeaders = requestHeaders ?? request.headers;
  let response = NextResponse.next({
    request: { headers: baseHeaders },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: baseHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response, isAdmin: false, hasUser: false };
  }

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const service = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    response,
    isAdmin: profile?.role === "admin",
    hasUser: true,
  };
}
