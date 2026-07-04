import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

let serviceSupabase: ReturnType<typeof createClient<Database>> | null = null;

/** Singleton service-role client (safe on the server; avoids reconnect overhead). */
export function createServiceSupabase() {
  if (!serviceSupabase) {
    serviceSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
