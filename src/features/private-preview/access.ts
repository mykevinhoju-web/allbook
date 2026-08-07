import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { isPlatformAdminUser } from "@/features/platform/server/profiles";

import { isPrivatePreviewEnabled } from "./config";
import {
  PRIVATE_PREVIEW_ACCESS_COOKIE,
  verifyPreviewAccessToken,
} from "./preview-access-cookie";

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

/** True when the signed Private Preview access cookie is present. */
export async function hasPreviewAccessCookie(): Promise<boolean> {
  try {
    const jar = await cookies();
    return verifyPreviewAccessToken(
      jar.get(PRIVATE_PREVIEW_ACCESS_COOKIE)?.value,
    );
  } catch {
    return false;
  }
}

/** Whether the real Marketplace UI may be shown. */
export async function canAccessMarketplacePreview(): Promise<boolean> {
  if (!isPrivatePreviewEnabled()) return true;
  if (await hasPreviewAccessCookie()) return true;
  return getIsPlatformAdmin();
}
