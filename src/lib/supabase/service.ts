import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

let serviceSupabase: ReturnType<typeof createClient<Database>> | null = null;

function resolveServiceRoleKey(): string {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRoleKey) return serviceRoleKey;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it in Vercel project settings.",
    );
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required.",
    );
  }

  return anonKey;
}

/** Singleton service-role client (safe on the server; bypasses RLS). */
export function createServiceSupabase() {
  if (!serviceSupabase) {
    serviceSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      resolveServiceRoleKey(),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return serviceSupabase;
}
