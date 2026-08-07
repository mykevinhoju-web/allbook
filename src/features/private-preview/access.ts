import { createClient } from "@/lib/supabase/server";
import { isPlatformAdminUser } from "@/features/platform/server/profiles";

import { isPrivatePreviewEnabled } from "./config";

/** True when current Supabase user is a platform admin (profiles.role = admin). */
export async function getIsPlatformAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    return isPlatformAdminUser(user.id);
  } catch {
    return false;
  }
}

/** Whether the real Marketplace UI may be shown. */
export async function canAccessMarketplacePreview(): Promise<boolean> {
  if (!isPrivatePreviewEnabled()) return true;
  return getIsPlatformAdmin();
}
