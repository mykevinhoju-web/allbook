import { createClient } from "@/lib/supabase/server";
import {
  ensureUserProfile,
  isPlatformAdminUser,
} from "@/features/platform/server/profiles";

export class PlatformAuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "PlatformAuthError";
  }
}

/** Server-side gate: Supabase Auth user + profiles.role === 'admin'. */
export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new PlatformAuthError("Sign in required.", 401);
  }

  await ensureUserProfile({
    userId: user.id,
    email: user.email,
    fullName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null,
  });

  const ok = await isPlatformAdminUser(user.id);
  if (!ok) {
    throw new PlatformAuthError(
      "Access denied. AllBook Admin requires an admin profile.",
      403,
    );
  }

  return user;
}
